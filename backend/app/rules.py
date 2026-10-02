from __future__ import annotations

from datetime import date

from app.models import DeclarationInput, EvaluationResult, RegimeChoice, RentalKind


SOURCE_IDS = {
    "impots_locations": "impots-locations-meublees-2026",
    "service_social": "service-public-cotisations-meuble-2026",
    "bofip_regime": "bofip-bic-location-meublee-regime-2026",
    "impots_2042": "impots-formulaire-2042-2026",
    "impots_reel": "impots-location-meublee-declarer-2026",
    "form_2031": "impots-formulaire-2031-sd-2026",
}


def _i18n(fr: object, zh: object, en: object, ar: object) -> dict[str, object]:
    return {"fr": fr, "zh": zh, "en": en, "ar": ar}


def evaluate_lmnp(data: DeclarationInput, citations: list[dict[str, str]]) -> EvaluationResult:
    warnings: list[str] = []
    steps: list[str] = []
    copy_sheet: list[dict[str, object]] = []
    source_ids = {
        SOURCE_IDS["impots_locations"],
        SOURCE_IDS["service_social"],
        SOURCE_IDS["bofip_regime"],
        SOURCE_IDS["impots_2042"],
    }

    if not data.fiscal_resident_france:
        warnings.append(
            "Non-résident fiscal · 非法国税务居民：本工具仅完整覆盖法国税务居民常见 LMNP 情形。申报前请核对 impots.gouv.fr 与 BOFiP 中针对 non-résidents 的规则。"
        )

    if not data.furnished:
        return _result(
            "out_of_scope",
            "Hors champ LMNP · 不属于 LMNP",
            "Aucun · 无",
            0,
            [],
            ["Location nue · 空房出租：通常属于 revenus fonciers，不属于 BIC / LMNP。本工具只处理 location meublée。"],
            warnings,
            citations,
            source_ids,
            {"reason": "not_furnished"},
        )

    exemption = _exemption_status(data)
    if exemption:
        copy_sheet.append(
            {
                "form": "Declaration de revenus",
                "section": "LMNP",
                "field": "Recettes exonérées · 免税收入",
                "value": "0 EUR",
                "note": exemption,
            }
        )
        return _result(
            "ok",
            "Exempt furnished rental income",
            "exempt",
            0,
            copy_sheet,
            [
                exemption,
                "Conserver les justificatifs · 请保留租约、收款记录、面积、租金计算和满足免税条件的证明。",
            ],
            warnings,
            citations,
            source_ids,
            {"exempt": True},
        )

    classification = _classification(data)
    if classification == "Possible LMP":
        warnings.append(
            "LMP possible · 可能属于职业性带家具出租：recettes annuelles > 23 000 EUR 且 recettes > autres revenus d'activité du foyer fiscal。本工具主要面向 LMNP，请在申报前核对 LMP 规则。"
        )

    micro = _micro_parameters(data)
    micro_available = _micro_available(data, micro["threshold"])
    regime = _select_regime(data, micro_available)
    real_calc = _real_accounting_calculation(data)

    if not data.has_siret:
        steps.append("Guichet des formalités · 企业手续窗口：如尚未取得 SIRET，请先申报 location meublée 活动并取得 SIRET。")
    if data.first_year_activity:
        steps.append("Déclaration initiale de CFE n°1447-C-SD · 首年 CFE 初始申报：如适用，应在 12 月 31 日前准备。")

    if data.receipts <= 23000 or data.receipts <= data.other_activity_income:
        steps.append("Cotisations sociales · 社会保险缴费：按当前输入看，通常属于 patrimoine privé 管理收入；普通 LMNP 情形一般不缴 cotisations sociales，但 prélèvements sociaux 通常仍通过所得税处理。")
    else:
        warnings.append("Cotisations sociales · 社会保险缴费：recettes > 23 000 EUR 且超过其他职业收入，可能需要适用社会保险登记规则，请核对 URSSAF / impots 说明。")

    if regime.startswith("micro-BIC"):
        taxable = _micro_taxable_basis(data.receipts, micro["abatement_rate"])
        copy_sheet.extend(_micro_copy_sheet(data, micro, taxable))
        steps.extend(
            [
                "Déclaration en ligne · 网上申报：添加 formulaire complémentaire 2042-C-PRO。",
                "Rubrique LMNP · 找到 revenus des locations meublées non professionnelles 栏目。",
                "Micro-BIC · 把 recettes brutes 填入对应 LMNP micro-BIC 格号；不要自己先扣 abattement，税局会自动计算。",
            ]
        )
    elif regime == "reel":
        source_ids.add(SOURCE_IDS["impots_reel"])
        source_ids.add(SOURCE_IDS["form_2031"])
        taxable = data.real_taxable_result if data.real_taxable_result is not None else real_calc["fiscal_result_before_prior_deficits"]
        copy_sheet.extend(_reel_copy_sheet(data, taxable))
        form_2031 = _form_2031_guide(data, taxable, real_calc)
        steps.extend(
            [
                "Déclaration de résultat n°2031 · 结果申报：在把结果填入个人申报前，需通过专业税务空间提交 2031 及附表。",
                "2042-C-PRO · 个人所得税附表：添加 2042-C-PRO，并在 LMNP régime réel 栏目填写非职业 BIC 结果。",
                "Comptabilité BIC · 商业账务：charges、amortissements、déficits 应来自账务和 liasse fiscale；本工具只生成抄填提示，不能替代会计处理。",
            ]
        )
        warnings.append("Régime réel · 实际制度：需要完整商业账、2031 附表和折旧/亏损处理。申报前请确认 amortissements、déficits、charges non déductibles。")
    else:
        taxable = 0
        form_2031 = []
        warnings.append("Régime non déterminé · 无法根据当前输入确定可支持的计税制度。")

    if not micro_available and data.regime_choice == RegimeChoice.micro:
        warnings.append("Micro-BIC demandé mais seuil dépassé · 你选择了 micro-BIC，但 N-1 / N-2 recettes 看起来超过本地规则采用的 micro-BIC 门槛。")

    result = _result(
        "ok",
        classification,
        regime,
        taxable,
        copy_sheet,
        steps,
        warnings,
        citations,
        source_ids,
        {
            "micro_available": micro_available,
            "micro_threshold": micro["threshold"],
            "abatement_rate": micro["abatement_rate"],
            "real_calc": real_calc,
        },
        form_2031=form_2031 if regime == "reel" else [],
        accounting_summary=_accounting_summary(real_calc) if regime == "reel" else [],
    )
    return _with_lmnp_i18n(result, data, regime, taxable, micro, micro_available, real_calc)


def _classification(data: DeclarationInput) -> str:
    if data.receipts > 23000 and data.receipts > data.other_activity_income:
        return "Possible LMP"
    return "LMNP"


def _exemption_status(data: DeclarationInput) -> str | None:
    if (
        data.rental_kind == RentalKind.principal_home_room
        and data.in_principal_home
        and data.tenant_main_or_seasonal_residence
        and data.reasonable_rent
    ):
        return "Exonération article 35 bis du CGI · 可能适用主住宅内房间出租免税：出租房间属于你的 résidence principale，租客作为 résidence principale 或符合条件的 séjour saisonnier 使用，且 prix de location fixé dans des limites raisonnables。"
    if data.rental_kind == RentalKind.chambre_hotes and data.in_principal_home and data.receipts <= 760:
        return "Chambres d'hôtes · 可能适用 760 EUR 免税限额：在 résidence principale 中经常性出租 chambre d'hôtes，全年 recettes 不超过 760 EUR。"
    return None


def _micro_parameters(data: DeclarationInput) -> dict[str, float]:
    if data.rental_kind == RentalKind.tourism_unclassified:
        return {"threshold": 15000.0, "abatement_rate": 0.30}
    return {"threshold": 77700.0, "abatement_rate": 0.50}


def _micro_available(data: DeclarationInput, threshold: float) -> bool:
    history = [
        value
        for value in (data.receipts_previous_year, data.receipts_two_years_prior)
        if value is not None
    ]
    if not history:
        return data.receipts <= threshold
    return any(value <= threshold for value in history)


def _select_regime(data: DeclarationInput, micro_available: bool) -> str:
    if data.regime_choice == RegimeChoice.reel:
        return "reel"
    if data.regime_choice == RegimeChoice.micro:
        return "micro-BIC" if micro_available else "reel"
    return "micro-BIC" if micro_available else "reel"


def _micro_taxable_basis(receipts: float, rate: float) -> float:
    if receipts <= 0:
        return 0
    abatement = min(receipts, max(305.0, receipts * rate))
    return round(receipts - abatement, 2)


def _real_accounting_calculation(data: DeclarationInput) -> dict[str, object]:
    detailed_charges = _detailed_charges(data)
    charges_total = detailed_charges if detailed_charges > 0 else data.charges
    depreciation_rows = _depreciation_rows(data)
    theoretical_depreciation = round(sum(row["annual_amount"] for row in depreciation_rows), 2)
    depreciation_total = theoretical_depreciation if theoretical_depreciation > 0 else data.depreciation
    result_before_depreciation = round(data.receipts - charges_total, 2)
    deductible_depreciation_cap = max(0.0, result_before_depreciation)
    deductible_depreciation = round(min(depreciation_total, deductible_depreciation_cap), 2)
    deferred_depreciation = round(max(0.0, depreciation_total - deductible_depreciation), 2)
    fiscal_result = round(result_before_depreciation - deductible_depreciation, 2)
    prior_deficit_used = round(min(max(0.0, fiscal_result), data.prior_lmnp_deficit), 2)
    result_after_prior_deficits = round(fiscal_result - prior_deficit_used, 2)
    return {
        "charges_total": round(charges_total, 2),
        "result_before_depreciation": result_before_depreciation,
        "theoretical_depreciation": depreciation_total,
        "deductible_depreciation": deductible_depreciation,
        "deferred_depreciation_39c": deferred_depreciation,
        "fiscal_result_before_prior_deficits": fiscal_result,
        "prior_deficit_used": prior_deficit_used,
        "fiscal_result_after_prior_deficits": result_after_prior_deficits,
        "depreciation_rows": depreciation_rows,
        "detailed_charges_used": detailed_charges > 0,
    }


def _detailed_charges(data: DeclarationInput) -> float:
    return round(
        data.loan_interest
        + data.property_tax
        + data.insurance
        + data.condo_fees
        + data.repairs_maintenance
        + data.cfe
        + data.accounting_fees
        + data.other_deductible_charges,
        2,
    )


def _depreciation_rows(data: DeclarationInput) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    land_value = data.land_value
    if land_value <= 0 and data.acquisition_price > 0:
        land_value = round(data.acquisition_price * 0.15, 2)
    building_base = max(0.0, data.acquisition_price + data.notary_fees + data.agency_fees - land_value)
    component_plan = [
        ("Gros œuvre · 结构主体", 0.50, 50),
        ("Toiture / étanchéité · 屋顶/防水", 0.10, 25),
        ("Installations techniques · 水电暖等设备", 0.20, 25),
        ("Agencements intérieurs · 室内装修配置", 0.20, 15),
    ]
    for label, share, years in component_plan:
        rows.append(_depreciation_row(label, building_base * share, years, data.building_service_start, data.tax_year))
    rows.append(_depreciation_row("Mobilier et électroménager · 家具家电", data.furniture_value, 7, data.furniture_service_start, data.tax_year))
    rows.append(_depreciation_row("Travaux d'amélioration immobilisés · 资本化改善工程", data.works_improvement, 10, data.works_service_start, data.tax_year))
    return [row for row in rows if row["base"] > 0]


def _depreciation_row(label: str, base: float, years: int, start_value: str, tax_year: int) -> dict[str, object]:
    prorata = _year_prorata(start_value, tax_year)
    annual_full = base / years if years else 0
    annual_amount = round(annual_full * prorata, 2)
    return {
        "component": label,
        "base": round(base, 2),
        "years": years,
        "prorata": prorata,
        "annual_amount": annual_amount,
    }


def _year_prorata(start_value: str, tax_year: int) -> float:
    if not start_value:
        return 1.0
    try:
        start = date.fromisoformat(start_value)
    except ValueError:
        return 1.0
    if start.year < tax_year:
        return 1.0
    if start.year > tax_year:
        return 0.0
    end = date(tax_year, 12, 31)
    days = (end - start).days + 1
    return round(max(0, min(days, 365)) / 365, 4)


def _accounting_summary(real_calc: dict[str, object]) -> list[dict[str, object]]:
    rows = [
        ("Recettes brutes · 总收入", "À partir du formulaire · 来自你填写的 recettes", None),
        ("Charges déductibles · 可扣费用", "Somme des charges détaillées ou champ charges · 明细费用合计或手填 charges", real_calc["charges_total"]),
        ("Résultat avant amortissements · 折旧前结果", "Recettes - charges · 收入减费用", real_calc["result_before_depreciation"]),
        ("Amortissements théoriques · 理论折旧", "Selon composants · 按组件计算", real_calc["theoretical_depreciation"]),
        ("Amortissements déductibles · 当年可扣折旧", "Limite article 39 C · 按 39 C 限制", real_calc["deductible_depreciation"]),
        ("Amortissements reportés · 递延折旧", "Fraction non déduite, à suivre · 未扣部分需结转跟踪", real_calc["deferred_depreciation_39c"]),
        ("Résultat fiscal avant déficits antérieurs · 以前亏损抵扣前税务结果", "Résultat après amortissement déductible · 扣当年可扣折旧后", real_calc["fiscal_result_before_prior_deficits"]),
        ("Déficit LMNP antérieur utilisé · 使用以前 LMNP 亏损", "Dans la limite du bénéfice · 不超过当年盈利", real_calc["prior_deficit_used"]),
        ("Résultat fiscal après déficits antérieurs · 最终税务结果", "À reporter selon les cases applicables · 按适用格号报告", real_calc["fiscal_result_after_prior_deficits"]),
    ]
    return [
        {"libelle": label, "explication": explanation, "valeur": "" if value is None else value}
        for label, explanation, value in rows
    ]


def _micro_copy_sheet(data: DeclarationInput, micro: dict[str, float], taxable: float) -> list[dict[str, object]]:
    box_hint = "5NI"
    box_note = "Autres locations meublées, y compris location meublée de longue durée · 其他带家具出租，包括带家具长租。Déclarant 2 / personne à charge : cases voisines 5OI / 5PI · 第二申报人/被抚养人用相邻格号。"
    if data.rental_kind == RentalKind.tourism_unclassified:
        box_hint = "5NH"
        box_note = "Meublé de tourisme non classé · 未评级旅游家具房。Déclarant 2 / personne à charge : 5OH / 5PH。"
    elif data.rental_kind in {RentalKind.tourism_classified, RentalKind.chambre_hotes}:
        box_hint = "5NG"
        box_note = "Chambres d'hôtes et meublés de tourisme classés · 民宿客房和已评级旅游家具房。Déclarant 2 / personne à charge : 5OG / 5PG。"
    return [
        {
            "form": "2042-C-PRO",
            "section": "Revenus des locations meublées non professionnelles - régime micro-BIC · LMNP micro-BIC 栏目",
            "field": box_hint,
            "value": round(data.receipts, 2),
            "note": f"Indiquer les recettes brutes, pas le revenu net imposable · 填总收入，不填扣除后的税基。{box_note} L'administration applique l'abattement · 税局自动计算 forfaitaire abattement。",
        },
        {
            "form": "Note de calcul · 计算说明",
            "section": "Estimation locale · 本地估算",
            "field": f"Base imposable estimée après abattement de {int(micro['abatement_rate'] * 100)}% · 扣除后估算税基",
            "value": taxable,
            "note": "Contrôle uniquement · 仅供核对；不要把这个估算税基填入 recettes brutes 格号。",
        },
        {
            "form": "Note d'adresse · 地址说明",
            "section": "Identification de la location · 出租房识别",
            "field": "Adresse de la location",
            "value": data.property_address or "À compléter manuellement · 手动填写",
            "note": "Reprendre le libellé demandé par le portail fiscal · 按税局页面要求填写地址字段。",
        },
    ]


def _reel_copy_sheet(data: DeclarationInput, taxable: float) -> list[dict[str, object]]:
    result_box = "5NA" if taxable >= 0 else "5NY"
    result_note = "Déclarant 2 / personne à charge : 5OA / 5PA · 第二申报人/被抚养人用 5OA / 5PA。" if taxable >= 0 else "Déclarant 2 / personne à charge : 5OY / 5PY · 第二申报人/被抚养人用 5OY / 5PY。"
    return [
        {
            "form": "2031 + annexes",
            "section": "Déclaration de résultat BIC · BIC 结果申报",
            "field": "Résultat fiscal LMNP · LMNP 税务结果",
            "value": round(taxable, 2),
            "note": "À établir depuis la comptabilité et à télétransmettre via l'espace professionnel · 根据账务编制，并通过专业税务空间提交。",
        },
        {
            "form": "2042-C-PRO",
            "section": "Revenus des locations meublées non professionnelles - régime réel · LMNP 实际制度栏目",
            "field": result_box,
            "value": round(taxable, 2),
            "note": f"Reporter le résultat issu de la déclaration 2031 · 填入 2031 的税务结果。{result_note} Déficits antérieurs non imputés : cases 5GA à 5GJ si concerné · 以前年度未抵扣亏损如适用填 5GA 至 5GJ。",
        },
    ]


def _form_2031_guide(data: DeclarationInput, taxable: float, real_calc: dict[str, object]) -> list[dict[str, object]]:
    final_taxable = float(real_calc["fiscal_result_after_prior_deficits"]) if data.real_taxable_result is None else taxable
    profit = final_taxable if final_taxable >= 0 else 0
    loss = abs(final_taxable) if final_taxable < 0 else 0
    business_address = data.business_address or data.property_address or "À compléter · 待填写"
    software = data.accounting_software or ("À préciser · 请填写软件名称" if data.computerized_accounting else "Sans objet · 不适用")
    guide = [
        _2031("Page 1", "A Identification", "Exercice ouvert le / clos le", _period(data), "Reporter la période comptable · 填会计年度起止。LMNP 常见为 01/01/N - 31/12/N，首年按实际开始日。"),
        _2031("Page 1", "A Identification", "SIREN / SIRET", _join_value(data.siren, data.siret), "Reporter les numéros officiels INSEE · 填 INSEE 官方 SIREN/SIRET。SIREN 9 位，SIRET 14 位。"),
        _2031("Page 1", "A Identification", "Dénomination de l'entreprise", data.business_name or "Nom Prénom - Location meublée · 姓名 - 带家具出租", "Utiliser le libellé de l'espace professionnel ou de l'avis SIRENE · 以专业税务空间或 SIRENE 显示为准。"),
        _2031("Page 1", "A Identification", "Adresse de l'entreprise", business_address, "Adresse rattachée au SIRET ou à l'activité · 填 SIRET/活动对应地址。"),
        _2031("Page 1", "A Identification", "Adresse du déclarant", data.declarant_address or "Si différente, à compléter · 如不同则填写", "À remplir si votre adresse personnelle diffère · 如果个人通信地址不同则填写。"),
        _2031("Page 1", "A Identification", "Mél / Téléphone", _join_value(data.email, data.phone), "Coordonnées de contact · 税局联系邮箱和电话。"),
        _2031("Page 1", "A Identification", "Activités exercées", data.activity_label or "Location meublée non professionnelle", "Souligner l'activité principale si plusieurs activités · 多项活动时标出主要活动。"),
        _2031("Page 1", "B Récapitulation des éléments d'imposition", "1 Résultat fiscal : bénéfice / déficit", _profit_loss(profit, loss), "Reporter le résultat fiscal BIC issu de la comptabilité ou de la 2033-B · 填 BIC 税务结果。盈利填 bénéfice，亏损填 déficit。"),
        _2031("Page 1", "B Récapitulation des éléments d'imposition", "2 Revenus de valeurs et capitaux mobiliers", _money(data.securities_income), "En LMNP simple, souvent 0 · 单纯 LMNP 通常为 0；如账务包含证券/资本收入则填。"),
        _2031("Page 1", "B Récapitulation des éléments d'imposition", "4 Bénéfice / déficit", _profit_loss(profit, loss), "Même résultat à reporter dans la synthèse · 在汇总框内重复报告盈利或亏损。"),
        _2031("Page 1", "B Récapitulation des éléments d'imposition", "4bis / 4ter Plus-values long terme", _money(data.long_term_capital_gain_128), "À remplir seulement si une plus-value long terme imposable est concernée · 只有涉及长期增值时填写。"),
        _2031("Page 1", "B Récapitulation des éléments d'imposition", "5 Plus-values", f"Court terme {_money(data.short_term_capital_gain)} ; long terme 12,8 % {_money(data.long_term_capital_gain_128)}", "À laisser à 0 si aucune cession d'actif concernée · 没有资产出售/增值则为 0。"),
        _2031("Page 1", "C Exonérations et abattements", "Revenus exonérés de l'impôt sur le revenu", _money(data.exempt_income), "Ne pas inventer d'exonération · 不要自行假设免税；只有有明确税法依据时填写。"),
        _2031("Page 1", "D Contribution temporaire de solidarité", "Contribution temporaire de solidarité", "Non concerné sauf situation particulière · 通常不适用", "LMNP particulier classique généralement non concerné · 普通个人 LMNP 通常不涉及。"),
        _2031("Page 2", "E / F Coordonnées et signature", "Nom, qualité, lieu, date, signature", "À compléter lors du dépôt · 提交时填写", "Signature du déclarant ou mandataire · 申报人或代理人签署。"),
        _2031("Page 2", "G Divers", "Comptabilité informatisée / logiciel", ("Oui · 是 : " + software) if data.computerized_accounting else "Non · 否", "Reporter le logiciel utilisé · 填会计软件名称；Excel 或 expert-comptable 的软件也应如实说明。"),
        _2031("Page 2", "G Divers", "Prélèvements personnels", _money(data.personal_withdrawals), "Sommes prélevées par l'exploitant · 个人从活动账户提取的金额。"),
        _2031("Page 2", "G Divers", "Apports en capital ou versements en compte courant", _money(data.capital_contributions), "Sommes apportées par l'exploitant · 个人投入活动的金额。"),
        _2031("Page 2", "I BIC non professionnels", "Locations meublées non professionnelles : bénéfice / déficit", _profit_loss(profit, loss), "Cadre spécifique LMNP non professionnel · 非职业 BIC/LMNP 专用框。把 2031 税务结果按盈利/亏损填入。"),
        _2031("Page 2", "I BIC non professionnels", "Dont résultat avant imputation des déficits antérieurs", _money(float(real_calc["fiscal_result_before_prior_deficits"])), "Si vous utilisez des déficits antérieurs, distinguer le résultat avant imputation · 如使用以前亏损，要区分抵扣前结果。"),
        _2031("Pages annexes 2033", "Amortissements", "Dotations aux amortissements déductibles", _money(float(real_calc["deductible_depreciation"])), "Reporter seulement la part déductible fiscalement · 只报告税务上当年可扣折旧；l'excédent 39 C doit être suivi séparément · 39 C 超额部分要单独跟踪。"),
        _2031("Pages 3-4", "Notice et contrôles", "Pièces et annexes", "2033-A à 2033-G ou liasse applicable · 附表按适用制度提交", "La 2031-SD ne remplace pas les annexes du régime réel simplifié/normal · 2031 主表不能替代实际制度附表。"),
    ]
    return guide


def _2031(page: str, cadre: str, rubrique: str, valeur: object, explication: str) -> dict[str, object]:
    return {
        "page": page,
        "cadre": cadre,
        "rubrique": rubrique,
        "valeur": valeur,
        "explication": explication,
    }


def _period(data: DeclarationInput) -> str:
    opened = data.exercise_opened_on or "date début · 开始日期"
    closed = data.exercise_closed_on or "date clôture · 结束日期"
    return f"{opened} → {closed}"


def _join_value(*values: str) -> str:
    usable = [value for value in values if value]
    return " / ".join(usable) if usable else "À compléter · 待填写"


def _profit_loss(profit: float, loss: float) -> str:
    return f"Bénéfice {_money(profit)} ; déficit {_money(loss)}"


def _money(value: float) -> str:
    return f"{round(value, 2)} EUR"


def _with_lmnp_i18n(
    result: EvaluationResult,
    data: DeclarationInput,
    regime: str,
    taxable: float,
    micro: dict[str, float],
    micro_available: bool,
    real_calc: dict[str, object],
) -> EvaluationResult:
    steps: list[object] = []
    warnings: list[object] = []

    if not data.has_siret:
        steps.append(_i18n(
            "Declare the furnished-rental activity on the business formalities portal and obtain a SIRET before filing tax forms.",
            "先在企业手续窗口申报带家具出租活动并取得 SIRET，再进行税务填报。",
            "Declare the furnished-rental activity on the business formalities portal and obtain a SIRET before filing tax forms.",
            "صرّح بنشاط التأجير المفروش عبر بوابة إجراءات الشركات واحصل على رقم SIRET قبل تعبئة التصاريح الضريبية.",
        ))
    if data.first_year_activity:
        steps.append(_i18n(
            "For the first year, prepare the initial CFE return form 1447-C-SD if it applies, usually before 31 December.",
            "首年如适用，请准备 CFE 初始申报 1447-C-SD，通常应在 12 月 31 日前处理。",
            "For the first year, prepare the initial CFE return form 1447-C-SD if it applies, usually before 31 December.",
            "في السنة الأولى، حضّر تصريح CFE الأولي 1447-C-SD إذا كان منطبقاً، عادة قبل 31 ديسمبر.",
        ))

    if regime.startswith("micro-BIC"):
        steps.extend([
            _i18n(
                "Open your online income-tax return and add the supplementary form 2042-C-PRO.",
                "打开个人所得税线上申报，并添加附表 2042-C-PRO。",
                "Open your online income-tax return and add the supplementary form 2042-C-PRO.",
                "افتح تصريح ضريبة الدخل عبر الإنترنت وأضف الملحق 2042-C-PRO.",
            ),
            _i18n(
                "Go to non-professional furnished-rental income and choose the micro-BIC area matching the rental type.",
                "进入非职业性带家具出租收入栏目，并选择与你出租类型对应的 micro-BIC 区域。",
                "Go to non-professional furnished-rental income and choose the micro-BIC area matching the rental type.",
                "انتقل إلى دخل التأجير المفروش غير المهني واختر خانة micro-BIC المناسبة لنوع التأجير.",
            ),
            _i18n(
                "Enter gross receipts only. Do not subtract the allowance yourself; the tax administration applies it automatically.",
                "只填写总收入，不要自行扣除 abattement；税局会自动计算扣除。",
                "Enter gross receipts only. Do not subtract the allowance yourself; the tax administration applies it automatically.",
                "أدخل الإيرادات الإجمالية فقط. لا تخصم التخفيض بنفسك؛ تطبقه الإدارة الضريبية تلقائياً.",
            ),
        ])
    elif regime == "reel":
        steps.extend([
            _i18n(
                "Prepare the BIC result return 2031 and its annexes from the accounting records before copying the result to the personal return.",
                "先根据账务准备 BIC 结果申报 2031 及其附表，再把结果抄到个人所得税申报。",
                "Prepare the BIC result return 2031 and its annexes from the accounting records before copying the result to the personal return.",
                "حضّر تصريح نتيجة BIC رقم 2031 وملاحقه من السجلات المحاسبية قبل نقل النتيجة إلى التصريح الشخصي.",
            ),
            _i18n(
                "Add 2042-C-PRO in the personal return and report the non-professional BIC result in the LMNP real-regime area.",
                "在个人所得税申报中添加 2042-C-PRO，并在 LMNP 实际制度栏目填写非职业 BIC 结果。",
                "Add 2042-C-PRO in the personal return and report the non-professional BIC result in the LMNP real-regime area.",
                "أضف 2042-C-PRO في التصريح الشخصي وانقل نتيجة BIC غير المهنية إلى خانة LMNP بالنظام الفعلي.",
            ),
            _i18n(
                "Use accounting figures for expenses, depreciation and deficits. This tool gives a filing guide and does not replace bookkeeping.",
                "费用、折旧和亏损应来自商业账务。本工具只生成填报指引，不能替代会计处理。",
                "Use accounting figures for expenses, depreciation and deficits. This tool gives a filing guide and does not replace bookkeeping.",
                "استخدم الأرقام المحاسبية للمصاريف والإهلاك والخسائر. هذه الأداة تقدم دليلاً للتعبئة ولا تعوض المحاسبة.",
            ),
        ])
        warnings.append(_i18n(
            "Real regime: check the accounts, 2031 annexes, depreciation limits and prior deficits before filing.",
            "实际制度：申报前请核对完整账务、2031 附表、折旧限制和以前年度亏损。",
            "Real regime: check the accounts, 2031 annexes, depreciation limits and prior deficits before filing.",
            "النظام الفعلي: تحقق من الحسابات وملاحق 2031 وحدود الإهلاك والخسائر السابقة قبل التصريح.",
        ))

    if not micro_available and data.regime_choice == RegimeChoice.micro:
        warnings.append(_i18n(
            "Micro-BIC was selected, but the prior-year receipts appear to exceed the micro-BIC threshold used by this tool.",
            "你选择了 micro-BIC，但 N-1 / N-2 收入看起来超过本工具采用的 micro-BIC 门槛。",
            "Micro-BIC was selected, but the prior-year receipts appear to exceed the micro-BIC threshold used by this tool.",
            "تم اختيار micro-BIC، لكن إيرادات السنوات السابقة تبدو أعلى من عتبة micro-BIC التي تستخدمها هذه الأداة.",
        ))

    result.steps = steps
    result.warnings = warnings
    result.copy_sheet = _copy_sheet_i18n(data, regime, taxable, micro)
    result.form_2031 = _form_2031_i18n(data, taxable, real_calc) if regime == "reel" else []
    result.accounting_summary = _accounting_summary_i18n(real_calc) if regime == "reel" else []
    if isinstance(result.debug, dict) and isinstance(result.debug.get("real_calc"), dict):
        calc = result.debug["real_calc"]
        calc["depreciation_rows"] = [
            {**row, "component": _depreciation_component_i18n(row["component"])}
            for row in calc.get("depreciation_rows", [])
        ]
    return result


def _accounting_summary_i18n(real_calc: dict[str, object]) -> list[dict[str, object]]:
    rows = [
        ("Gross receipts", "\u603b\u6536\u5165", "Gross receipts", "\u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629", "From the declaration form", "\u6765\u81ea\u4f60\u586b\u5199\u7684\u7533\u62a5\u8868", "From the declaration form", "\u0645\u0646 \u0646\u0645\u0648\u0630\u062c \u0627\u0644\u062a\u0635\u0631\u064a\u062d", None),
        ("Deductible expenses", "\u53ef\u6263\u9664\u8d39\u7528", "Deductible expenses", "\u0627\u0644\u0646\u0641\u0642\u0627\u062a \u0627\u0644\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062e\u0635\u0645", "Detailed expenses or the expenses field", "\u660e\u7ec6\u8d39\u7528\u6216\u624b\u586b\u8d39\u7528\u5408\u8ba1", "Detailed expenses or the expenses field", "\u0627\u0644\u0646\u0641\u0642\u0627\u062a \u0627\u0644\u062a\u0641\u0635\u064a\u0644\u064a\u0629 \u0623\u0648 \u062e\u0627\u0646\u0629 \u0627\u0644\u0646\u0641\u0642\u0627\u062a", real_calc["charges_total"]),
        ("Result before depreciation", "\u6298\u65e7\u524d\u7ed3\u679c", "Result before depreciation", "\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0642\u0628\u0644 \u0627\u0644\u0625\u0647\u0644\u0627\u0643", "Gross receipts minus expenses", "\u6536\u5165\u51cf\u8d39\u7528", "Gross receipts minus expenses", "\u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a \u0645\u0637\u0631\u0648\u062d\u0627\u064b \u0645\u0646\u0647\u0627 \u0627\u0644\u0646\u0641\u0642\u0627\u062a", real_calc["result_before_depreciation"]),
        ("Deductible depreciation", "\u5f53\u5e74\u53ef\u6263\u6298\u65e7", "Deductible depreciation", "\u0627\u0644\u0625\u0647\u0644\u0627\u0643 \u0627\u0644\u0642\u0627\u0628\u0644 \u0644\u0644\u062e\u0635\u0645", "Tax-deductible amount for the year", "\u5f53\u5e74税务上可扣的折旧", "Tax-deductible amount for the year", "\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0642\u0627\u0628\u0644 \u0644\u0644\u062e\u0635\u0645 \u0647\u0630\u0647 \u0627\u0644\u0633\u0646\u0629", real_calc["deductible_depreciation"]),
        ("Final tax result", "\u6700\u7ec8\u7a0e\u52a1\u7ed3\u679c", "Final tax result", "\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0636\u0631\u064a\u0628\u064a\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u0629", "Result after deductible depreciation and prior deficits", "\u6263\u9664\u6298\u65e7和以前亏损后的结果", "Result after deductible depreciation and prior deficits", "\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0628\u0639\u062f \u062e\u0635\u0645 \u0627\u0644\u0625\u0647\u0644\u0627\u0643 \u0648\u0627\u0644\u062e\u0633\u0627\u0626\u0631 \u0627\u0644\u0633\u0627\u0628\u0642\u0629", real_calc["fiscal_result_after_prior_deficits"]),
    ]
    return [
        {"libelle": _i18n(fr, zh, en, ar), "explication": _i18n(fr_note, zh_note, en_note, ar_note), "valeur": "" if value is None else value}
        for fr, zh, en, ar, fr_note, zh_note, en_note, ar_note, value in rows
    ]


def _depreciation_component_i18n(value: str) -> dict[str, str]:
    labels = {
        "Gros": ("Gros œuvre", "\u7ed3\u6784\u4e3b\u4f53", "Structural work", "\u0627\u0644\u0647\u064a\u0643\u0644 \u0627\u0644\u0625\u0646\u0634\u0627\u0626\u064a"),
        "Toiture": ("Toiture / étanchéité", "\u5c4b\u9876 / \u9632\u6c34", "Roofing / waterproofing", "\u0627\u0644\u0633\u0642\u0641 / \u0627\u0644\u0639\u0632\u0644 \u0627\u0644\u0645\u0627\u0626\u064a"),
        "Installations": ("Installations techniques", "\u6280\u672f\u8bbe\u5907", "Technical installations", "\u0627\u0644\u062a\u062c\u0647\u064a\u0632\u0627\u062a \u0627\u0644\u0641\u0646\u064a\u0629"),
        "Agencements": ("Agencements intérieurs", "\u5ba4\u5185\u88c5\u4fee\u914d\u7f6e", "Interior fittings", "\u062a\u062c\u0647\u064a\u0632\u0627\u062a \u062f\u0627\u062e\u0644\u064a\u0629"),
        "Mobilier": ("Mobilier et électroménager", "\u5bb6\u5177\u548c\u5bb6\u7535", "Furniture and appliances", "\u0627\u0644\u0623\u062b\u0627\u062b \u0648\u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629"),
        "Travaux": ("Travaux d'amélioration immobilisés", "\u8d44\u672c\u5316\u6539\u5584\u5de5\u7a0b", "Capitalized improvement works", "\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0631\u0623\u0633\u0645\u0627\u0644\u064a\u0629"),
    }
    for key, labels_for_key in labels.items():
        if value.startswith(key):
            return _i18n(*labels_for_key)
    return _i18n(value, value, value, value)


def _copy_sheet_i18n(data: DeclarationInput, regime: str, taxable: float, micro: dict[str, float]) -> list[dict[str, object]]:
    if regime.startswith("micro-BIC"):
        box_hint = "5NI"
        box_label = _i18n(
            "Other furnished rentals, including long-term furnished rental",
            "其他带家具出租，包括带家具长租",
            "Other furnished rentals, including long-term furnished rental",
            "تأجيرات مفروشة أخرى، بما فيها التأجير المفروش طويل الأجل",
        )
        if data.rental_kind == RentalKind.tourism_unclassified:
            box_hint = "5NH"
            box_label = _i18n("Unclassified tourist furnished rental", "未评级旅游家具房", "Unclassified tourist furnished rental", "تأجير سياحي مفروش غير مصنف")
        elif data.rental_kind in {RentalKind.tourism_classified, RentalKind.chambre_hotes}:
            box_hint = "5NG"
            box_label = _i18n("Classified tourist furnished rental or guest room", "已评级旅游家具房或民宿客房", "Classified tourist furnished rental or guest room", "تأجير سياحي مفروش مصنف أو غرفة ضيافة")
        return [
            {
                "form": "2042-C-PRO",
                "section": _i18n("Non-professional furnished-rental income - micro-BIC", "非职业性带家具出租收入 - micro-BIC", "Non-professional furnished-rental income - micro-BIC", "دخل التأجير المفروش غير المهني - micro-BIC"),
                "field": box_hint,
                "value": round(data.receipts, 2),
                "note": _i18n(
                    f"Enter gross receipts. Box type: {box_label['fr']}. The tax administration applies the {int(micro['abatement_rate'] * 100)}% allowance.",
                    f"填写总收入。栏目类型：{box_label['zh']}。税局会自动适用 {int(micro['abatement_rate'] * 100)}% 扣除。",
                    f"Enter gross receipts. Box type: {box_label['en']}. The tax administration applies the {int(micro['abatement_rate'] * 100)}% allowance.",
                    f"أدخل الإيرادات الإجمالية. نوع الخانة: {box_label['ar']}. تطبق الإدارة الضريبية تخفيض {int(micro['abatement_rate'] * 100)}%.",
                ),
            },
            {
                "form": _i18n("Calculation note", "计算说明", "Calculation note", "مذكرة حساب"),
                "section": _i18n("Local estimate", "本地估算", "Local estimate", "تقدير محلي"),
                "field": _i18n("Estimated taxable basis after allowance", "扣除后估算税基", "Estimated taxable basis after allowance", "الوعاء الضريبي التقديري بعد التخفيض"),
                "value": taxable,
                "note": _i18n("For checking only; do not enter this basis in the gross-receipts box.", "仅供核对；不要把这个估算税基填入总收入格号。", "For checking only; do not enter this basis in the gross-receipts box.", "للمراجعة فقط؛ لا تدخل هذا الوعاء في خانة الإيرادات الإجمالية."),
            },
        ]
    result_box = "5NA" if taxable >= 0 else "5NY"
    return [
        {
            "form": "2031 + annexes",
            "section": _i18n("BIC result return", "BIC 结果申报", "BIC result return", "تصريح نتيجة BIC"),
            "field": _i18n("LMNP tax result", "LMNP 税务结果", "LMNP tax result", "نتيجة LMNP الضريبية"),
            "value": round(taxable, 2),
            "note": _i18n("Prepare it from accounting records and submit it through the professional tax account.", "根据账务编制，并通过专业税务空间提交。", "Prepare it from accounting records and submit it through the professional tax account.", "يحضّر من السجلات المحاسبية ويرسل عبر الحساب الضريبي المهني."),
        },
        {
            "form": "2042-C-PRO",
            "section": _i18n("Non-professional furnished-rental income - real regime", "非职业性带家具出租收入 - 实际制度", "Non-professional furnished-rental income - real regime", "دخل التأجير المفروش غير المهني - النظام الفعلي"),
            "field": result_box,
            "value": round(taxable, 2),
            "note": _i18n("Copy the result from the 2031 return. Use the loss box if the result is negative.", "填入 2031 的税务结果；如为亏损，使用亏损格号。", "Copy the result from the 2031 return. Use the loss box if the result is negative.", "انقل النتيجة من تصريح 2031. استخدم خانة الخسارة إذا كانت النتيجة سالبة."),
        },
    ]


def _form_2031_i18n(data: DeclarationInput, taxable: float, real_calc: dict[str, object]) -> list[dict[str, object]]:
    final_taxable = float(real_calc["fiscal_result_after_prior_deficits"]) if data.real_taxable_result is None else taxable
    profit = final_taxable if final_taxable >= 0 else 0
    loss = abs(final_taxable) if final_taxable < 0 else 0
    business_address = data.business_address or data.property_address or _i18n("To complete", "待填写", "To complete", "يستكمل")
    software = data.accounting_software or (_i18n("Specify the software name", "请填写软件名称", "Specify the software name", "اذكر اسم البرنامج") if data.computerized_accounting else _i18n("Not applicable", "不适用", "Not applicable", "غير منطبق"))
    profit_loss = _i18n(f"Profit {_money(profit)}; loss {_money(loss)}", f"盈利 {_money(profit)}；亏损 {_money(loss)}", f"Profit {_money(profit)}; loss {_money(loss)}", f"ربح {_money(profit)}؛ خسارة {_money(loss)}")
    rows = [
        ("Page 1", "A Identification", _i18n("Financial year opened / closed", "会计年度开始 / 结束", "Financial year opened / closed", "بداية / نهاية السنة المالية"), _period(data), _i18n("Enter the accounting period. A common LMNP year is 01/01/N-31/12/N; first year follows the actual start date.", "填写会计年度起止。LMNP 常见为 01/01/N-31/12/N，首年按实际开始日。", "Enter the accounting period. A common LMNP year is 01/01/N-31/12/N; first year follows the actual start date.", "أدخل الفترة المحاسبية. السنة الشائعة في LMNP هي 01/01/N-31/12/N؛ السنة الأولى حسب تاريخ البدء الفعلي.")),
        ("Page 1", "A Identification", "SIREN / SIRET", _join_value(data.siren, data.siret), _i18n("Enter the official INSEE numbers: SIREN has 9 digits and SIRET has 14 digits.", "填写 INSEE 官方号码：SIREN 9 位，SIRET 14 位。", "Enter the official INSEE numbers: SIREN has 9 digits and SIRET has 14 digits.", "أدخل أرقام INSEE الرسمية: SIREN من 9 أرقام وSIRET من 14 رقماً.")),
        ("Page 1", "A Identification", _i18n("Business name", "企业/活动名称", "Business name", "اسم النشاط"), data.business_name or _i18n("Name - furnished rental", "姓名 - 带家具出租", "Name - furnished rental", "الاسم - تأجير مفروش"), _i18n("Use the wording shown in the professional tax account or SIRENE notice.", "以专业税务空间或 SIRENE 显示为准。", "Use the wording shown in the professional tax account or SIRENE notice.", "استخدم الصياغة الظاهرة في الحساب الضريبي المهني أو إشعار SIRENE.")),
        ("Page 1", "A Identification", _i18n("Business address", "活动地址", "Business address", "عنوان النشاط"), business_address, _i18n("Use the address attached to the SIRET or the furnished-rental activity.", "填写 SIRET 或出租活动对应地址。", "Use the address attached to the SIRET or the furnished-rental activity.", "استخدم العنوان المرتبط برقم SIRET أو بنشاط التأجير المفروش.")),
        ("Page 1", "A Identification", _i18n("Contact email / phone", "联系邮箱 / 电话", "Contact email / phone", "البريد / الهاتف"), _join_value(data.email, data.phone), _i18n("Enter contact details used by the tax administration.", "填写税局联系用邮箱和电话。", "Enter contact details used by the tax administration.", "أدخل بيانات الاتصال التي تستخدمها الإدارة الضريبية.")),
        ("Page 1", "B Tax summary", _i18n("Tax result: profit / loss", "税务结果：盈利 / 亏损", "Tax result: profit / loss", "النتيجة الضريبية: ربح / خسارة"), profit_loss, _i18n("Report the BIC tax result from the accounts or annex 2033-B.", "填写来自账务或 2033-B 的 BIC 税务结果。", "Report the BIC tax result from the accounts or annex 2033-B.", "انقل نتيجة BIC الضريبية من الحسابات أو الملحق 2033-B.")),
        ("Page 1", "B Tax summary", _i18n("Securities / capital income", "证券/资本收入", "Securities / capital income", "دخل الأوراق المالية ورأس المال"), _money(data.securities_income), _i18n("Usually 0 for a simple LMNP activity unless the accounts include such income.", "单纯 LMNP 通常为 0；如账务包含此类收入才填写。", "Usually 0 for a simple LMNP activity unless the accounts include such income.", "عادة 0 في نشاط LMNP بسيط إلا إذا تضمنت الحسابات هذا الدخل.")),
        ("Page 1", "C Exemptions", _i18n("Exempt income", "免税收入", "Exempt income", "دخل معفى"), _money(data.exempt_income), _i18n("Do not invent an exemption; fill only if you have a clear legal basis.", "不要自行假设免税；只有有明确税法依据时填写。", "Do not invent an exemption; fill only if you have a clear legal basis.", "لا تفترض إعفاءً من تلقاء نفسك؛ املأ فقط عند وجود أساس قانوني واضح.")),
        ("Page 2", "G Miscellaneous", _i18n("Computerized accounting / software", "电子会计 / 软件", "Computerized accounting / software", "محاسبة إلكترونية / برنامج"), (_i18n(f"Yes: {software['fr'] if isinstance(software, dict) else software}", f"是：{software['zh'] if isinstance(software, dict) else software}", f"Yes: {software['en'] if isinstance(software, dict) else software}", f"نعم: {software['ar'] if isinstance(software, dict) else software}") if data.computerized_accounting else _i18n("No", "否", "No", "لا")), _i18n("Report the accounting software used, including the accountant's software if relevant.", "填写使用的会计软件，包括会计师使用的软件。", "Report the accounting software used, including the accountant's software if relevant.", "اذكر برنامج المحاسبة المستخدم، بما في ذلك برنامج المحاسب عند الاقتضاء.")),
        ("Page 2", "I Non-professional BIC", _i18n("Non-professional furnished rentals: profit / loss", "非职业性带家具出租：盈利 / 亏损", "Non-professional furnished rentals: profit / loss", "التأجير المفروش غير المهني: ربح / خسارة"), profit_loss, _i18n("Specific LMNP box: copy the 2031 tax result as profit or loss.", "LMNP 专用框：把 2031 税务结果按盈利或亏损填入。", "Specific LMNP box: copy the 2031 tax result as profit or loss.", "خانة خاصة بـ LMNP: انقل نتيجة 2031 كربح أو خسارة.")),
        ("2033 annexes", "Depreciation", _i18n("Deductible depreciation allowance", "可扣除折旧", "Deductible depreciation allowance", "الإهلاك القابل للخصم"), _money(float(real_calc["deductible_depreciation"])), _i18n("Report only the tax-deductible portion for the year; track any excess separately.", "只报告税务上当年可扣折旧；超额部分要单独跟踪。", "Report only the tax-deductible portion for the year; track any excess separately.", "صرّح فقط بالجزء القابل للخصم ضريبياً للسنة؛ وتتبع أي فائض بشكل منفصل.")),
        ("Annexes", "Forms", _i18n("Required annexes", "所需附表", "Required annexes", "الملاحق المطلوبة"), _i18n("2033-A to 2033-G or applicable tax package", "2033-A 至 2033-G 或适用税表包", "2033-A to 2033-G or applicable tax package", "2033-A إلى 2033-G أو الحزمة الضريبية المنطبقة"), _i18n("The 2031-SD main form does not replace the real-regime annexes.", "2031-SD 主表不能替代实际制度附表。", "The 2031-SD main form does not replace the real-regime annexes.", "النموذج الرئيسي 2031-SD لا يغني عن ملاحق النظام الفعلي.")),
    ]
    return [_2031(page, cadre, rubrique, valeur, explication) for page, cadre, rubrique, valeur, explication in rows]


def _result(
    status: str,
    classification: str,
    regime: str,
    taxable_basis: float,
    copy_sheet: list[dict[str, object]],
    steps: list[str],
    warnings: list[str],
    citations: list[dict[str, str]],
    source_ids: set[str],
    debug: dict[str, object],
    form_2031: list[dict[str, object]] | None = None,
    accounting_summary: list[dict[str, object]] | None = None,
) -> EvaluationResult:
    selected_citations = [citation for citation in citations if citation["id"] in source_ids]
    return EvaluationResult(
        status=status,
        classification=classification,
        regime=regime,
        taxable_basis=round(taxable_basis, 2),
        copy_sheet=copy_sheet,
        steps=steps,
        warnings=warnings,
        citations=selected_citations,
        form_2031=form_2031 or [],
        accounting_summary=accounting_summary or [],
        debug=debug,
    )
