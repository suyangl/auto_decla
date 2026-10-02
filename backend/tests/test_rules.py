from app.models import DeclarationInput, RegimeChoice, RentalKind
from app.rules import evaluate_lmnp


CITATIONS = [
    {"id": "impots-locations-meublees-2026", "title": "x", "publisher": "impots", "url": "u", "checked_at": "d"},
    {"id": "service-public-cotisations-meuble-2026", "title": "x", "publisher": "sp", "url": "u", "checked_at": "d"},
    {"id": "bofip-bic-location-meublee-regime-2026", "title": "x", "publisher": "bofip", "url": "u", "checked_at": "d"},
    {"id": "impots-formulaire-2042-2026", "title": "x", "publisher": "impots", "url": "u", "checked_at": "d"},
    {"id": "impots-location-meublee-declarer-2026", "title": "x", "publisher": "impots", "url": "u", "checked_at": "d"},
]


def test_long_term_micro_bic_lmnp() -> None:
    result = evaluate_lmnp(
        DeclarationInput(
            rental_kind=RentalKind.long_term,
            receipts=12000,
            receipts_previous_year=10000,
            other_activity_income=50000,
            has_siret=True,
        ),
        CITATIONS,
    )

    assert result.classification == "LMNP"
    assert result.regime == "micro-BIC"
    assert result.taxable_basis == 6000
    assert result.copy_sheet[0]["field"] == "5NI"
    assert result.copy_sheet[0]["value"] == 12000


def test_unclassified_tourism_threshold_forces_reel() -> None:
    result = evaluate_lmnp(
        DeclarationInput(
            rental_kind=RentalKind.tourism_unclassified,
            receipts=20000,
            receipts_previous_year=20000,
            receipts_two_years_prior=21000,
            other_activity_income=60000,
        ),
        CITATIONS,
    )

    assert result.regime == "reel"
    assert result.debug["micro_available"] is False
    assert result.copy_sheet[1]["field"] == "5NA"


def test_principal_home_room_exemption() -> None:
    result = evaluate_lmnp(
        DeclarationInput(
            rental_kind=RentalKind.principal_home_room,
            receipts=3000,
            in_principal_home=True,
            tenant_main_or_seasonal_residence=True,
            reasonable_rent=True,
        ),
        CITATIONS,
    )

    assert result.regime == "exempt"
    assert result.taxable_basis == 0


def test_reel_uses_declared_result() -> None:
    result = evaluate_lmnp(
        DeclarationInput(
            rental_kind=RentalKind.long_term,
            receipts=50000,
            other_activity_income=100000,
            regime_choice=RegimeChoice.reel,
            real_taxable_result=-1200,
        ),
        CITATIONS,
    )

    assert result.regime == "reel"
    assert result.taxable_basis == -1200
    assert result.copy_sheet[1]["field"] == "5NY"
