const api = "";

const form = document.querySelector("#lmnp-form");
const output = document.querySelector("#output");
const health = document.querySelector("#health");
if (health) health.hidden = true;
const searchButton = document.querySelector("#search-btn");
const searchQuery = document.querySelector("#search-query");
const searchResults = document.querySelector("#search-results");
const helpDialog = document.querySelector("#help-dialog");
const helpTitle = document.querySelector("#help-title");
const helpBody = document.querySelector("#help-body");
const helpClose = document.querySelector("#help-close");
const moduleNav = document.querySelector("#module-nav");
const serviceHome = document.querySelector("#service-home");
const serviceCards = document.querySelector("#service-cards");
const serviceDetail = document.querySelector("#service-detail");
const lmnpPage = document.querySelector("#lmnp-page");

let localServices = [];
let lastResult = null;

const serviceUi = {
  fr: {
    home: "Accueil",
    serviceHomeTitle: "Choisissez une démarche",
    serviceHomeNote: "Chaque module lit uniquement la base locale du projet. Aucun dépôt officiel, aucun appel réseau externe.",
    back: "Retour",
    audience: "Public",
    checklist: "Checklist",
    guide: "Guide pas à pas",
    actions: "À faire",
    documents: "Documents",
    outputs: "Résultat attendu",
    tracks: "Parcours de renouvellement",
    procedure: "Étapes",
    coreDocuments: "Documents clés",
    risks: "Points d'attention",
    officialLinks: "Sites et explications officiels",
  },
  zh: {
    home: "首页",
    serviceHomeTitle: "请选择办理事项",
    serviceHomeNote: "每个模块只读取项目本地数据库，不联网提交。",
    back: "返回",
    audience: "适用人群",
    checklist: "总清单",
    guide: "分步指导",
    actions: "要做什么",
    documents: "准备材料",
    outputs: "完成后得到",
    tracks: "续签路径",
    procedure: "办理步骤",
    coreDocuments: "核心材料",
    risks: "风险点",
    officialLinks: "相关网站和官方解释",
  },
  en: {
    home: "Home",
    serviceHomeTitle: "Choose a procedure",
    serviceHomeNote: "Each module reads only the project's local database. It does not submit anything online.",
    back: "Back",
    audience: "Audience",
    checklist: "Checklist",
    guide: "Step-by-step guide",
    actions: "What to do",
    documents: "Documents",
    outputs: "Expected output",
    tracks: "Renewal tracks",
    procedure: "Procedure",
    coreDocuments: "Key documents",
    risks: "Risk points",
    officialLinks: "Official websites and explanations",
  },
  ar: {
    home: "الرئيسية",
    serviceHomeTitle: "اختر إجراءً",
    serviceHomeNote: "كل وحدة تقرأ قاعدة البيانات المحلية فقط ولا ترسل أي طلب عبر الإنترنت.",
    back: "رجوع",
    audience: "الفئة المعنية",
    checklist: "قائمة التحقق",
    guide: "دليل خطوة بخطوة",
    actions: "ما يجب فعله",
    documents: "المستندات",
    outputs: "النتيجة المتوقعة",
    tracks: "مسارات التجديد",
    procedure: "الإجراءات",
    coreDocuments: "المستندات الأساسية",
    risks: "نقاط الانتباه",
    officialLinks: "المواقع والشروحات الرسمية",
  },
};

const appUi = {
  fr: {
    title: "Démarches des étrangers en France",
    intro: "Guides locaux pour les impôts, la santé, les titres de séjour et la location meublée. Données locales, sans dépôt automatique.",
  },
  zh: {
    title: "外国人在法办事",
    intro: "面向外国人在法国生活的本地指南：报税、医保、居留和带家具出租。只读取本地数据，不自动联网提交。",
  },
  en: {
    title: "Foreigners' procedures in France",
    intro: "Local guides for taxes, health insurance, residence permits and furnished rental. Local data only, no automatic filing.",
  },
  ar: {
    title: "إجراءات الأجانب في فرنسا",
    intro: "أدلة محلية للضرائب والتأمين الصحي وتصاريح الإقامة والتأجير المفروش. بيانات محلية فقط دون إرسال تلقائي.",
  },
};

const landlordGuideUi = {
  fr: {
    title: "Guide bailleur LMNP",
    intro: "Avant de déclarer les revenus, préparez aussi les démarches de bailleur : immatriculation, SIRET, CFE, justificatifs et choix du régime fiscal.",
    siretTitle: "Demander un SIRET",
    items: [
      "Déclarez le début de l'activité de location meublée sur le guichet des formalités des entreprises.",
      "L'Insee attribue ensuite un numéro SIRET, à conserver pour les démarches fiscales.",
      "Service-Public indique que les revenus de location meublée doivent mentionner le numéro SIRET obtenu lors de la déclaration de l'activité.",
      "Impots.gouv.fr précise que l'immatriculation permet d'obtenir un numéro SIRET et que la démarche est obligatoire pour les loueurs en meublé.",
    ],
    link: "Explication Service-Public sur les revenus de location meublée",
  },
  zh: {
    title: "LMNP 房东指导",
    intro: "在申报房租收入前，也要先整理房东端手续：注册活动、申请 SIRET、CFE、凭证和计税制度选择。",
    siretTitle: "如何申请 SIRET",
    items: [
      "在 Guichet des formalités des entreprises 上申报带家具出租活动开始。",
      "随后 INSEE 会分配 SIRET 号码；这个号码要保存，用于税务和后续手续。",
      "Service-Public 说明，带家具出租收入申报需要填写你在申报出租活动时取得的 SIRET。",
      "impots.gouv.fr 也说明，无论职业/非职业带家具出租，都需要完成登记以取得 SIRET；该手续是强制性的。",
    ],
    link: "Service-Public：带家具出租收入说明",
  },
  en: {
    title: "LMNP landlord guide",
    intro: "Before declaring rental income, prepare the landlord-side formalities: activity registration, SIRET, CFE, records and tax regime choice.",
    siretTitle: "How to apply for a SIRET",
    items: [
      "Declare the start of the furnished-rental activity on the business formalities portal.",
      "INSEE then assigns a SIRET number, which you should keep for tax formalities.",
      "Service-Public states that furnished-rental income must include the SIRET obtained when declaring the activity.",
      "impots.gouv.fr also states that furnished-rental landlords must register to obtain a SIRET; the formality is mandatory.",
    ],
    link: "Service-Public explanation on furnished-rental income",
  },
  ar: {
    title: "دليل المؤجر LMNP",
    intro: "قبل التصريح بدخل الإيجار، حضّر إجراءات المؤجر: تسجيل النشاط، رقم SIRET، CFE، المستندات واختيار النظام الضريبي.",
    siretTitle: "كيفية طلب رقم SIRET",
    items: [
      "صرّح ببدء نشاط التأجير المفروش عبر بوابة إجراءات الشركات.",
      "بعد ذلك يمنح INSEE رقم SIRET يجب الاحتفاظ به للإجراءات الضريبية.",
      "يوضح Service-Public أن دخل التأجير المفروش يتطلب ذكر رقم SIRET الذي تم الحصول عليه عند التصريح بالنشاط.",
      "كما يوضح impots.gouv.fr أن التسجيل للحصول على SIRET إجراء إلزامي للمؤجرين في التأجير المفروش.",
    ],
    link: "شرح Service-Public لدخل التأجير المفروش",
  },
};

const serviceMeta = {
  "foreigner-tax": {
    fr: { title: "Impôts pour étrangers", subtitle: "Déclaration fiscale", badge: "Guide local", summary: "Guide pas à pas pour la résidence fiscale, le numéro fiscal, les revenus et le suivi après dépôt.", audience: "Étrangers qui déclarent pour la première fois ou doivent organiser leurs revenus français et étrangers.", offline_notice: "Ce module lit uniquement la base locale et ne dépose aucune déclaration." },
    zh: { title: "外国人报税", subtitle: "法国个人所得税申报", badge: "本地分步向导", summary: "从税务居民、税号、收入分类到提交后保存凭证，整理首次或常规法国个人报税。", audience: "第一次报税，或需要整理法国/境外收入的外国人。", offline_notice: "本模块只读取本地数据，不连接 impots.gouv.fr，也不会提交申报。" },
    en: { title: "Tax filing for foreigners", subtitle: "French income tax", badge: "Local guide", summary: "Step-by-step guide for tax residence, tax number, income categories and post-filing records.", audience: "Foreigners filing for the first time or organizing French and foreign income.", offline_notice: "This module reads local data only and does not file anything." },
    ar: { title: "ضرائب الأجانب", subtitle: "إقرار ضريبة الدخل", badge: "دليل محلي", summary: "دليل خطوة بخطوة للإقامة الضريبية والرقم الضريبي وأنواع الدخل والمتابعة بعد الإرسال.", audience: "الأجانب الذين يصرحون لأول مرة أو ينظمون دخلهم الفرنسي والأجنبي.", offline_notice: "تقرأ هذه الوحدة البيانات المحلية فقط ولا ترسل أي إقرار." },
  },
  "health-insurance": {
    fr: { title: "Assurance maladie", subtitle: "CPAM / ameli", badge: "Guide local", summary: "Guide pour ouvrir les droits, suivre le numéro de sécurité sociale, créer ameli et demander la Carte Vitale.", audience: "Étudiants, salariés, familles et résidents étrangers qui doivent ouvrir leurs droits santé.", offline_notice: "Ce module ne se connecte pas à ameli.fr et ne téléverse aucun document." },
    zh: { title: "外国人办医保", subtitle: "CPAM / ameli", badge: "本地分步向导", summary: "整理开通医保、临时/正式社保号、ameli 账号、Carte Vitale 和 mutuelle 衔接。", audience: "学生、雇员、家庭成员和长期居住外国人。", offline_notice: "本模块不连接 ameli.fr，也不代替上传材料。" },
    en: { title: "Health insurance", subtitle: "CPAM / ameli", badge: "Local guide", summary: "Guide to opening rights, tracking the social-security number, creating ameli and requesting Carte Vitale.", audience: "Students, employees, families and foreign residents opening health-insurance rights.", offline_notice: "This module does not connect to ameli.fr or upload documents." },
    ar: { title: "التأمين الصحي", subtitle: "CPAM / ameli", badge: "دليل محلي", summary: "دليل لفتح الحقوق وتتبع رقم الضمان الاجتماعي وإنشاء حساب ameli وطلب بطاقة Vitale.", audience: "الطلاب والموظفون والعائلات والمقيمون الأجانب.", offline_notice: "لا تتصل هذه الوحدة بموقع ameli.fr ولا ترفع مستندات." },
  },
  "first-residence-card": {
    fr: { title: "Première carte de séjour", subtitle: "Première demande", badge: "Guide séjour", summary: "Guide pour VLS-TS, choix du statut, dossier, dépôt, compléments et retrait de carte.", audience: "Étrangers qui demandent leur première carte de séjour en France.", offline_notice: "Ce module ne se connecte pas à l'ANEF ou à la préfecture." },
    zh: { title: "首次申请居留卡", subtitle: "Première demande", badge: "首次居留向导", summary: "从 VLS-TS、身份路径、材料、提交、补件到取卡，整理首次居留申请。", audience: "VLS-TS 到期前或首次申请 carte de séjour 的人。", offline_notice: "本模块不连接 ANEF 或 prefecture，只保存本地清单。" },
    en: { title: "First residence card", subtitle: "First application", badge: "Residence guide", summary: "Guide for VLS-TS, status choice, documents, filing, additional requests and card pickup.", audience: "Foreigners applying for their first French residence card.", offline_notice: "This module does not connect to ANEF or the prefecture." },
    ar: { title: "أول بطاقة إقامة", subtitle: "طلب أول", badge: "دليل الإقامة", summary: "دليل لـ VLS-TS واختيار الوضع والملف والإرسال والوثائق الإضافية واستلام البطاقة.", audience: "الأجانب الذين يطلبون أول بطاقة إقامة في فرنسا.", offline_notice: "لا تتصل هذه الوحدة بمنصة ANEF أو المحافظة." },
  },
  "renew-residence-card": {
    fr: { title: "Renouveler le titre de séjour", subtitle: "Étudiant, salarié, talent, VPF", badge: "4 parcours", summary: "Guide de renouvellement séparé pour étudiant, salarié, passeport talent et vie privée et familiale.", audience: "Étrangers dont le titre arrive à expiration et qui renouvellent ou changent de statut.", offline_notice: "Ce module conserve une checklist locale et ne dépose aucune demande." },
    zh: { title: "续居留卡", subtitle: "学生签、工签、人才签证、VPF", badge: "四类续签向导", summary: "把学生签、工签、人才签证、VPF 四条路径拆开做续签指导。", audience: "居留卡即将到期，需要续签或换身份的人。", offline_notice: "本模块只保存本地清单，不自动连接或提交到行政平台。" },
    en: { title: "Renew residence card", subtitle: "Student, work, talent, VPF", badge: "4 tracks", summary: "Separate renewal guide for student, work, talent and private/family-life residence cards.", audience: "Foreigners whose card is expiring and who renew or change status.", offline_notice: "This module keeps a local checklist and does not submit applications." },
    ar: { title: "تجديد بطاقة الإقامة", subtitle: "طالب، عمل، موهبة، حياة خاصة وعائلية", badge: "4 مسارات", summary: "دليل منفصل لتجديد إقامة الطالب والعمل والموهبة والحياة الخاصة والعائلية.", audience: "الأجانب الذين تنتهي بطاقتهم ويجددون أو يغيرون الوضع.", offline_notice: "تحتفظ هذه الوحدة بقائمة محلية ولا ترسل طلبات." },
  },
};

const lmnpCard = {
  fr: {
    title: "Déclaration LMNP",
    subtitle: "Location meublée et guide bailleur",
    summary: "Assistant local pour revenus de location meublée, SIRET, CFE, micro-BIC, régime réel et brouillon 2031.",
  },
  zh: {
    title: "LMNP 带家具出租申报",
    subtitle: "房东指导和本地申报辅助",
    summary: "本地辅助整理带家具出租收入、SIRET、CFE、micro-BIC、实际制度和 2031 草稿。",
  },
  en: {
    title: "LMNP furnished rental",
    subtitle: "Landlord guide and local filing helper",
    summary: "Local helper for furnished-rental income, SIRET, CFE, micro-BIC, real regime and 2031 draft.",
  },
  ar: {
    title: "تصريح LMNP",
    subtitle: "دليل المؤجر ومساعد محلي",
    summary: "مساعد محلي لدخل التأجير المفروش وSIRET وCFE والنظام الحقيقي ومسودة 2031.",
  },
};

const moduleCards = {
  lmnp: {
    fr: {
      title: "Déclaration LMNP",
      subtitle: "Location meublée et guide bailleur",
      summary: "Assistant pour revenus de location meublée, SIRET, CFE, micro-BIC, régime réel et brouillon 2031.",
      nav: "LMNP",
    },
    zh: {
      title: "LMNP 带家具出租申报",
      subtitle: "房东指导和本地申报辅助",
      summary: "整理带家具出租收入、SIRET、CFE、micro-BIC、实际制度和 2031 草稿。",
      nav: "LMNP 申报",
    },
    en: {
      title: "LMNP furnished rental",
      subtitle: "Landlord guide and local filing helper",
      summary: "Helper for furnished-rental income, SIRET, CFE, micro-BIC, real regime and 2031 draft.",
      nav: "LMNP filing",
    },
    ar: {
      title: "تصريح LMNP",
      subtitle: "دليل المؤجر ومساعد محلي",
      summary: "مساعد لدخل التأجير المفروش وSIRET وCFE وmicro-BIC والنظام الفعلي ومسودة 2031.",
      nav: "تصريح LMNP",
    },
  },
  "foreigner-tax": {
    fr: { title: "Impôts pour étrangers", subtitle: "Déclaration fiscale", summary: "Résidence fiscale, numéro fiscal, revenus, dépôt et justificatifs.", nav: "Impôts" },
    zh: { title: "外国人报税", subtitle: "法国个人所得税申报", summary: "税务居民、税号、收入分类、提交和凭证保存。", nav: "报税" },
    en: { title: "Tax filing for foreigners", subtitle: "French income tax", summary: "Tax residence, tax number, income categories, filing and records.", nav: "Taxes" },
    ar: { title: "ضرائب الأجانب", subtitle: "إقرار ضريبة الدخل", summary: "الإقامة الضريبية والرقم الضريبي وأنواع الدخل والإرسال والمستندات.", nav: "الضرائب" },
  },
  "health-insurance": {
    fr: { title: "Assurance maladie", subtitle: "CPAM / ameli / Carte Vitale", summary: "Affiliation, justificatifs, numéro provisoire, compte ameli, Carte Vitale et CSS.", nav: "Assurance maladie" },
    zh: { title: "外国人办理医保", subtitle: "CPAM / ameli / Carte Vitale", summary: "参保、材料、临时号、ameli 账户、Carte Vitale 和 CSS。", nav: "医保" },
    en: { title: "Health insurance", subtitle: "CPAM / ameli / Vitale card", summary: "Affiliation, documents, temporary number, ameli account, Vitale card and CSS.", nav: "Health insurance" },
    ar: { title: "التأمين الصحي", subtitle: "CPAM / ameli / بطاقة Vitale", summary: "الانتساب والوثائق والرقم المؤقت وحساب ameli وبطاقة Vitale وCSS.", nav: "التأمين الصحي" },
  },
  "first-residence-card": {
    fr: { title: "Première carte de séjour", subtitle: "VLS-TS ou étudiant-concours", summary: "Deux situations distinctes puis dépôt, compléments et retrait.", nav: "Première carte" },
    zh: { title: "首次申请居留卡", subtitle: "VLS-TS 或 étudiant-concours", summary: "先区分两个独立情况，再处理提交、补件和取卡。", nav: "首次居留" },
    en: { title: "First residence card", subtitle: "VLS-TS or étudiant-concours", summary: "Two separate situations, then filing, requests and pickup.", nav: "First card" },
    ar: { title: "أول بطاقة إقامة", subtitle: "VLS-TS أو étudiant-concours", summary: "حالتان منفصلتان ثم الإرسال والطلبات والاستلام.", nav: "أول إقامة" },
  },
  "renew-residence-card": {
    fr: { title: "Renouveler le titre de séjour", subtitle: "Étudiant, salarié, talent, VPF", summary: "Calendrier, pièces communes, continuité, changement de statut et retrait.", nav: "Renouvellement" },
    zh: { title: "续居留卡", subtitle: "学生、工作、人才、VPF", summary: "时间线、通用材料、身份连续性、换身份和取卡。", nav: "续居留" },
    en: { title: "Renew residence card", subtitle: "Student, work, talent, VPF", summary: "Timeline, shared documents, continuity, status change and pickup.", nav: "Renewal" },
    ar: { title: "تجديد بطاقة الإقامة", subtitle: "طالب، عمل، موهبة، VPF", summary: "الجدول والوثائق المشتركة والاستمرارية وتغيير الوضع والاستلام.", nav: "التجديد" },
  },
};

function moduleCardCopy(id) {
  const card = moduleCards[id];
  if (!card) return null;
  return card[currentLanguage] || card.en || card.fr || card.zh || card.ar;
}

function currentModuleId() {
  return (window.location.hash || "#home").slice(1) || "home";
}

function updateHeaderIntro(moduleId = currentModuleId()) {
  const headerIntro = document.querySelector(".topbar p");
  if (!headerIntro) return;
  if (moduleId === "lmnp") {
    headerIntro.textContent = moduleCardCopy("lmnp").summary;
    return;
  }
  const service = localServices.find((item) => item.id === moduleId);
  if (service) {
    headerIntro.textContent = (moduleCardCopy(service.id) || localizedService(service)).summary;
    return;
  }
  headerIntro.textContent = appUi[currentLanguage].intro;
}

const serviceProcess = {
  "foreigner-tax": {
    fr: {
      checklist: ["Déterminer l'année des revenus et l'année de déclaration.", "Vérifier la résidence fiscale française.", "Identifier si vous avez déjà un numéro fiscal.", "Classer les revenus : salaire, stage, bourse, indépendant, loyers, revenus étrangers.", "Conserver l'accusé de dépôt, l'ASDIR et l'avis d'impôt."],
      steps: [
        { title: "Étape 1 : vérifier si vous devez déclarer", goal: "Comprendre si une déclaration française est nécessaire.", actions: ["Notez vos dates de présence en France.", "Vérifiez foyer, séjour principal, activité professionnelle et centre des intérêts économiques.", "Préparez une déclaration même avec peu de revenus si un avis d'impôt est utile."], documents: ["Passeport ou titre de séjour", "Justificatif de domicile", "Contrat ou certificat de scolarité"], outputs: ["Statut fiscal probable", "Année à déclarer"] },
        { title: "Étape 2 : numéro fiscal", goal: "Distinguer première déclaration et espace particulier existant.", actions: ["Cherchez votre numéro fiscal sur les courriers reçus.", "Si vous n'en avez pas, préparez une première déclaration ou une demande d'accès.", "Vérifiez adresse, état civil et RIB."], documents: ["Numéro fiscal", "RIB", "Pièce d'identité"], outputs: ["Accès fiscal prêt"] },
        { title: "Étape 3 : classer les revenus", goal: "Éviter de mélanger salaires, stages, revenus étrangers et activités indépendantes.", actions: ["Rassemblez les fiches de paie.", "Séparez les revenus étrangers.", "Listez les revenus locatifs ou indépendants."], documents: ["Fiches de paie", "Relevés bancaires", "Justificatifs étrangers"], outputs: ["Tableau des revenus"] }
      ],
    },
    en: {
      checklist: ["Identify the income year and filing year.", "Check French tax-residence indicators.", "Check whether you already have a tax number.", "Classify income: salary, internship, scholarship, self-employment, rent, foreign income.", "Keep the filing receipt, ASDIR and tax notice."],
      steps: [
        { title: "Step 1: check whether you need to file", goal: "Decide whether a French tax return is needed.", actions: ["Record your dates in France.", "Check home, main stay, work activity and economic-interest center.", "Prepare a return even with low income if you need a tax notice."], documents: ["Passport or residence permit", "Proof of address", "Work or school proof"], outputs: ["Likely tax status", "Income year"] },
        { title: "Step 2: tax number", goal: "Separate first filing from existing account access.", actions: ["Look for your tax number on tax letters.", "If none, prepare first filing or account-access request.", "Check address, civil status and RIB."], documents: ["Tax number", "RIB", "ID"], outputs: ["Tax access ready"] },
        { title: "Step 3: classify income", goal: "Avoid mixing salary, internships, foreign income and self-employment.", actions: ["Collect payslips.", "Separate foreign income.", "List rental or self-employed income."], documents: ["Payslips", "Bank statements", "Foreign tax records"], outputs: ["Income table"] }
      ],
    },
    ar: {
      checklist: ["تحديد سنة الدخل وسنة التصريح.", "التحقق من مؤشرات الإقامة الضريبية في فرنسا.", "التحقق مما إذا كان لديك رقم ضريبي.", "تصنيف الدخل حسب النوع.", "الاحتفاظ بإثبات الإرسال والإشعار الضريبي."],
      steps: [
        { title: "الخطوة 1: هل يجب التصريح؟", goal: "تحديد ما إذا كان التصريح الضريبي الفرنسي مطلوباً.", actions: ["سجل تواريخ وجودك في فرنسا.", "تحقق من السكن الرئيسي والعمل والمصالح الاقتصادية.", "حضّر التصريح إذا كنت تحتاج إلى إشعار ضريبي."], documents: ["جواز السفر أو بطاقة الإقامة", "إثبات السكن", "إثبات العمل أو الدراسة"], outputs: ["الوضع الضريبي المتوقع", "سنة الدخل"] }
      ],
    },
  },
  "health-insurance": {
    fr: {
      checklist: ["Choisir le parcours : étudiant, salarié, famille ou résidence stable.", "Préparer passeport, titre de séjour, acte de naissance, justificatif de domicile et RIB.", "Pour les étudiants étrangers, utiliser le portail dédié etudiant-etranger.ameli.fr.", "Suivre le numéro provisoire, le numéro définitif, le compte ameli et la Carte Vitale."],
      steps: [
        { title: "Étape 1 : choisir le parcours", goal: "Identifier le bon point d'entrée CPAM.", actions: ["Étudiant étranger : utilisez le portail dédié.", "Salarié : préparez contrat et bulletins de salaire.", "Famille ou résidence stable : préparez les justificatifs de situation."], documents: ["Passeport", "Titre de séjour", "Certificat de scolarité ou contrat"], outputs: ["Parcours CPAM"] },
        { title: "Étape 2 : préparer les documents civils", goal: "Éviter le blocage sur l'état civil.", actions: ["Préparez l'acte de naissance.", "Ajoutez la traduction si nécessaire.", "Vérifiez la cohérence du nom avec le passeport."], documents: ["Acte de naissance", "Traduction", "RIB"], outputs: ["Dossier identité prêt"] },
        { title: "Étape 3 : suivre le dossier", goal: "Ne pas perdre les demandes de complément.", actions: ["Notez la date de dépôt.", "Conservez les courriers CPAM.", "Téléchargez l'attestation de droits dès qu'elle est disponible."], documents: ["Récépissé", "Courriers CPAM"], outputs: ["Numéro de sécurité sociale suivi"] }
      ],
    },
    en: {
      checklist: ["Choose the track: student, employee, family or stable residence.", "Prepare passport, residence permit, birth certificate, proof of address and RIB.", "Foreign students should use etudiant-etranger.ameli.fr.", "Track temporary number, final number, ameli account and Carte Vitale."],
      steps: [
        { title: "Step 1: choose the track", goal: "Use the right CPAM entry point.", actions: ["Foreign student: use the dedicated student portal.", "Employee: prepare contract and payslips.", "Family or stable residence: prepare status proof."], documents: ["Passport", "Residence permit", "School certificate or contract"], outputs: ["CPAM track"] },
        { title: "Step 2: prepare civil-status documents", goal: "Avoid blocking issues with identity records.", actions: ["Prepare the birth certificate.", "Add translation if needed.", "Check name consistency with the passport."], documents: ["Birth certificate", "Translation", "RIB"], outputs: ["Identity file ready"] },
        { title: "Step 3: track the file", goal: "Do not miss additional-document requests.", actions: ["Record filing date.", "Keep CPAM letters.", "Download rights certificate when available."], documents: ["Receipt", "CPAM letters"], outputs: ["Social-security number tracked"] }
      ],
    },
    ar: {
      checklist: ["اختيار المسار: طالب، موظف، عائلة أو إقامة مستقرة.", "تحضير جواز السفر وبطاقة الإقامة وشهادة الميلاد وإثبات السكن وRIB.", "يستخدم الطلاب الأجانب بوابة etudiant-etranger.ameli.fr.", "متابعة الرقم المؤقت والنهائي وحساب ameli وبطاقة Vitale."],
      steps: [{ title: "الخطوة 1: اختيار المسار", goal: "اختيار مدخل CPAM الصحيح.", actions: ["الطالب الأجنبي يستخدم البوابة المخصصة.", "الموظف يحضر العقد وكشوف الراتب.", "العائلة أو الإقامة المستقرة تحضر إثبات الوضع."], documents: ["جواز السفر", "بطاقة الإقامة", "شهادة دراسة أو عقد"], outputs: ["مسار CPAM"] }],
    },
  },
  "first-residence-card": {
    fr: { checklist: ["Vérifier le VLS-TS, le visa et la date d'expiration.", "Choisir la catégorie de séjour.", "Scanner et nommer les pièces.", "Déposer, suivre les compléments et préparer le retrait."], steps: [{ title: "Étape 1 : date limite", goal: "Éviter un dépôt tardif.", actions: ["Notez l'expiration du visa ou VLS-TS.", "Vérifiez la validation VLS-TS.", "Préparez le calendrier de dépôt."], documents: ["Passeport", "Visa", "Validation VLS-TS"], outputs: ["Calendrier de première demande"] }, { title: "Étape 2 : catégorie", goal: "Adapter les pièces au statut.", actions: ["Étudiant : scolarité et ressources.", "Salarié : contrat et autorisation si nécessaire.", "Talent ou VPF : preuves spécifiques."], documents: ["Justificatifs du statut"], outputs: ["Liste de pièces"] }] },
    en: { checklist: ["Check VLS-TS, visa and expiry date.", "Choose the residence category.", "Scan and name documents.", "File, track additional requests and prepare pickup."], steps: [{ title: "Step 1: deadline", goal: "Avoid late filing.", actions: ["Record visa or VLS-TS expiry.", "Check VLS-TS validation.", "Prepare filing calendar."], documents: ["Passport", "Visa", "VLS-TS validation"], outputs: ["First-application timeline"] }, { title: "Step 2: category", goal: "Adapt documents to status.", actions: ["Student: school and resources.", "Employee: contract and authorization if needed.", "Talent or VPF: specific proof."], documents: ["Status proof"], outputs: ["Document list"] }] },
    ar: { checklist: ["التحقق من VLS-TS والتأشيرة وتاريخ الانتهاء.", "اختيار فئة الإقامة.", "مسح المستندات وتسميتها.", "الإرسال والمتابعة والتحضير للاستلام."], steps: [{ title: "الخطوة 1: الموعد النهائي", goal: "تجنب التأخير.", actions: ["سجل تاريخ انتهاء التأشيرة.", "تحقق من تفعيل VLS-TS.", "حضّر جدول الإرسال."], documents: ["جواز السفر", "التأشيرة"], outputs: ["جدول الطلب الأول"] }] },
  },
  "renew-residence-card": {
    fr: {
      checklist: ["Noter l'expiration du titre actuel.", "Choisir le parcours : étudiant, salarié, talent ou VPF.", "Préparer les preuves de continuité.", "Suivre attestation, récépissé, compléments et retrait."],
      tracks: [
        { title: "Renouvellement étudiant", subtitle: "Titre étudiant", when_to_use: "Vous poursuivez des études en France.", steps: ["Préparer inscription ou préinscription.", "Ajouter notes, assiduité et ressources.", "Déposer puis suivre les compléments."], documents: ["Certificat de scolarité", "Relevés de notes", "Ressources"], risk_points: ["Progression ou assiduité insuffisante.", "Ressources faibles."] },
        { title: "Renouvellement salarié", subtitle: "Salarié / travailleur temporaire", when_to_use: "Vous renouvelez un titre lié au travail.", steps: ["Vérifier contrat et employeur.", "Préparer bulletins de salaire et attestation employeur.", "Vérifier l'autorisation de travail si applicable."], documents: ["Contrat", "Bulletins de salaire", "Attestation employeur"], risk_points: ["Changement d'employeur.", "Interruption d'emploi."] },
        { title: "Renouvellement talent", subtitle: "Passeport talent", when_to_use: "Vous renouvelez une carte talent ou talent famille.", steps: ["Identifier la sous-catégorie.", "Vérifier contrat, salaire, mission ou projet.", "Préparer les pièces famille si nécessaire."], documents: ["Contrat", "Diplôme", "Projet ou mission"], risk_points: ["Conditions propres à chaque sous-catégorie."] },
        { title: "Renouvellement VPF", subtitle: "Vie privée et familiale", when_to_use: "Votre droit au séjour repose sur la vie familiale ou privée.", steps: ["Confirmer le fondement VPF.", "Préparer preuves de lien et communauté de vie.", "Ajouter justificatifs récents."], documents: ["Actes d'état civil", "Justificatifs de vie commune", "Documents famille"], risk_points: ["Preuves de vie commune insuffisantes."] }
      ],
    },
    en: {
      checklist: ["Record current card expiry.", "Choose track: student, work, talent or VPF.", "Prepare continuity proof.", "Track attestation, receipt, additional requests and pickup."],
      tracks: [
        { title: "Student renewal", subtitle: "Student residence card", when_to_use: "You continue studying in France.", steps: ["Prepare registration or pre-registration.", "Add grades, attendance and resources.", "File and track additional requests."], documents: ["School certificate", "Transcripts", "Resources"], risk_points: ["Weak progress or attendance.", "Insufficient resources."] },
        { title: "Work renewal", subtitle: "Employee / temporary worker", when_to_use: "You renew a work-based card.", steps: ["Check contract and employer.", "Prepare payslips and employer certificate.", "Check work authorization if applicable."], documents: ["Contract", "Payslips", "Employer certificate"], risk_points: ["Employer change.", "Employment interruption."] },
        { title: "Talent renewal", subtitle: "Passeport talent", when_to_use: "You renew a talent or talent-family card.", steps: ["Identify the sub-category.", "Check contract, salary, mission or project.", "Prepare family documents if needed."], documents: ["Contract", "Diploma", "Project or mission"], risk_points: ["Each sub-category has its own conditions."] },
        { title: "VPF renewal", subtitle: "Private and family life", when_to_use: "Your residence right is based on private or family life.", steps: ["Confirm the VPF basis.", "Prepare relationship and shared-life proof.", "Add recent supporting documents."], documents: ["Civil-status records", "Shared-life proof", "Family documents"], risk_points: ["Weak shared-life evidence."] }
      ],
    },
    ar: {
      checklist: ["تسجيل تاريخ انتهاء البطاقة الحالية.", "اختيار المسار: طالب، عمل، موهبة أو VPF.", "تحضير إثبات الاستمرارية.", "متابعة الشهادة والوصل والوثائق الإضافية."],
      tracks: [{ title: "تجديد الطالب", subtitle: "إقامة طالب", when_to_use: "تواصل الدراسة في فرنسا.", steps: ["تحضير التسجيل.", "إضافة العلامات والموارد.", "الإرسال والمتابعة."], documents: ["شهادة مدرسية", "كشف علامات", "موارد"], risk_points: ["تقدم أو حضور ضعيف."] }]
    },
  },
};

function localizedService(service) {
  return localizedValue(service);
}

const helpTexts = {
  tax_year: {
    title: "Année des revenus · 收入年份",
    body: [
      "Nom officiel : déclaration des revenus de l'année N, déposée en N+1.",
      "中文：这里填的是房租收入所属年份，不是你打开网站填表的年份。例如 2025 年收到的租金，通常在 2026 年申报。",
      "Où trouver : avis d'impôt, espace particulier impots.gouv.fr, rubrique « Déclarer mes revenus ».",
    ],
  },
  rental_kind: {
    title: "Nature de la location · 出租类型",
    body: [
      "Termes officiels : « location meublée », « meublé de tourisme classé », « meublé de tourisme non classé », « chambre d'hôtes ».",
      "中文：不同出租类型会影响 micro-BIC 门槛和扣除比例。长租带家具通常不等同于旅游短租。",
      "Où trouver : contrat de bail, classement éventuel du meublé de tourisme, annonce ou déclaration en mairie.",
    ],
  },
  receipts: {
    title: "Recettes brutes annuelles TTC · 年含税总收入",
    body: [
      "Nom officiel : « recettes » ou « recettes brutes » de location meublée.",
      "中文：填全年实际收到的租金及相关收入总额，不先扣费用、折旧或 abattement。",
      "Où trouver : relevés bancaires, quittances, plateforme de réservation, livre des recettes.",
    ],
  },
  other_activity_income: {
    title: "Autres revenus d'activité du foyer fiscal · 税户其他职业收入",
    body: [
      "Nom officiel : « autres revenus d'activité du foyer fiscal » pour distinguer LMNP et LMP.",
      "中文：这是整个税户的其他职业收入，例如工资、BIC/BNC/BA 专业收入等；用于判断是否可能变成 LMP。",
      "Où trouver : déclaration 2042 préremplie, bulletins de salaire, bénéfices professionnels déclarés.",
    ],
  },
  receipts_previous_year: {
    title: "Recettes N-1 · 上一年收入",
    body: [
      "Nom officiel : chiffre d'affaires ou recettes de l'année précédente.",
      "中文：如果当前收入年份是 N，N-1 就是上一年。例如收入年份 2025，则 N-1 是 2024。",
      "Où trouver : votre déclaration précédente, comptabilité, relevés bancaires ou livre des recettes.",
    ],
  },
  receipts_two_years_prior: {
    title: "Recettes N-2 · 前两年收入",
    body: [
      "Nom officiel : chiffre d'affaires ou recettes de l'avant-dernière année.",
      "中文：如果当前收入年份是 N，N-2 就是前两年。例如收入年份 2025，则 N-2 是 2023。",
      "Où trouver : ancienne déclaration, comptabilité, relevés bancaires ou livre des recettes.",
    ],
  },
  regime_choice: {
    title: "Régime d'imposition · 计税制度",
    body: [
      "Termes officiels : « micro-BIC » et « régime réel ».",
      "中文：micro-BIC 按总收入填表，由税局自动给 forfaitaire abattement；régime réel 需要商业账和 2031 税务结果。",
      "Où trouver : formulaire 2042-C-PRO, déclaration de résultat 2031, option éventuelle pour le régime réel.",
    ],
  },
  property_address: {
    title: "Adresse de la location · 出租房地址",
    body: [
      "Nom officiel : adresse du logement loué ou établissement de l'activité.",
      "中文：填写出租房的地址。税局页面可能要求识别出租地点或 SIRET 对应地址。",
      "Où trouver : bail, acte d'achat, taxe foncière, espace professionnel ou guichet des formalités.",
    ],
  },
  reasonable_rent: {
    title: "Prix de location fixé dans des limites raisonnables · 官方合理租金限额",
    body: [
      "Nom officiel : « prix de location fixé dans des limites raisonnables » pour l'exonération de l'article 35 bis du CGI.",
      "中文：这个不是主观判断。税局按每年每平方米、不含 charges 的上限看。2025 年：Île-de-France 213 €/m²/an，其他地区 157 €/m²/an。2026 年：Île-de-France 215 €/m²/an，其他地区 159 €/m²/an。",
      "Où trouver : impots.gouv.fr « Les locations meublées », question « louer une partie de ma résidence principale », et BOFiP BOI-BIC-CHAMP-40-20 §160.",
    ],
  },
  real_taxable_result: {
    title: "Résultat fiscal · 税务结果",
    body: [
      "Nom officiel : « résultat fiscal » de la déclaration de résultat BIC n°2031.",
      "中文：这是 régime réel 下会计/税务处理后的结果，不是简单的租金减费用。若有会计师，应使用 2031 liasse fiscale 的结果。",
      "Où trouver : déclaration 2031 et annexes, balance comptable, liasse fiscale.",
    ],
  },
  charges: {
    title: "Charges déductibles annuelles en EUR · 全年可扣费用金额",
    body: [
      "Nom officiel : charges déductibles du bénéfice industriel et commercial.",
      "中文：这里填全年欧元金额，不填百分比，也不填每月金额。比如全年物业费 1 600 €、保险 180 €、贷款利息 4 100 €，合计 5 880，就填 5880。",
      "Où trouver : factures, appels de charges, intérêts d'emprunt, assurance, taxe foncière selon règles applicables. Si tu remplis les détails plus bas, l'outil utilise ces détails en priorité.",
    ],
  },
  loan_interest: {
    title: "Intérêts d'emprunt · 贷款利息",
    body: [
      "Nom officiel : intérêts d'emprunt supportés pour l'activité de location meublée.",
      "中文：填本年度实际支付的“利息金额”，单位是欧元。不要填贷款利率：不是 0.035，也不是 3.5 %。也不要填整个月供，因为月供里包含还本金。",
      "真实例子：银行每月扣 1 200 €，其中 350 € 是 intérêts，850 € 是 remboursement du capital。本年度利息合计 4 100 €，这里填 4100。",
      "Où trouver : tableau d'amortissement du prêt, attestation annuelle d'intérêts, relevés de prêt ou espace bancaire.",
    ],
  },
  depreciation: {
    title: "Amortissements · 折旧",
    body: [
      "Nom officiel : amortissements pratiqués en comptabilité BIC.",
      "中文：折旧不能随便估，需要依据房屋、家具、工程等资产的会计处理；建议由会计师确认。",
      "Où trouver : tableau d'amortissement comptable, liasse fiscale, documents de l'expert-comptable.",
    ],
  },
  exercise_dates: {
    title: "Exercice ouvert / clos · 会计年度起止",
    body: [
      "Nom officiel : « Exercice ouvert le » et « clos le » sur la 2031-SD.",
      "中文：通常 LMNP 个人用自然年，例如 2025-01-01 到 2025-12-31；如开业第一年，开始日可能是实际开始出租/登记日期。",
      "Où trouver : date de début d'activité, SIRET, comptabilité ou liasse fiscale.",
    ],
  },
  siren: {
    title: "SIREN · 9 位企业号",
    body: [
      "Nom officiel : SIREN, 9 chiffres, cadre A Identification de la 2031-SD.",
      "中文：SIREN 是企业主体号，不是 14 位 SIRET。",
      "Où trouver : avis SIRENE INSEE, guichet des formalités, espace professionnel impots.gouv.fr.",
    ],
  },
  siret: {
    title: "SIRET · 14 位机构号",
    body: [
      "Nom officiel : SIRET, 14 chiffres, SIREN + NIC de l'établissement.",
      "中文：如果只有一个出租活动，SIRET 通常对应这个出租活动地址或注册机构地址。",
      "Où trouver : avis SIRENE INSEE, espace professionnel, courriers fiscaux.",
    ],
  },
  business_name: {
    title: "Dénomination de l'entreprise · 企业/活动名称",
    body: [
      "Nom officiel : « Dénomination de l'entreprise » sur la 2031-SD.",
      "中文：个人 LMNP 通常可写姓名 + location meublée，按你的 SIRET/税务空间显示为准。",
      "Où trouver : avis SIRENE, espace professionnel impots.gouv.fr.",
    ],
  },
  business_address: {
    title: "Adresse de l'entreprise · 活动地址",
    body: [
      "Nom officiel : « Adresse de l'entreprise » sur la 2031-SD.",
      "中文：使用 SIRET 对应地址；如果税局要求活动地址，通常是出租房或登记地址。",
      "Où trouver : avis SIRENE, espace professionnel, taxe foncière, bail.",
    ],
  },
  declarant_address: {
    title: "Adresse du déclarant · 申报人地址",
    body: [
      "Nom officiel : adresse du déclarant si différente de l'adresse du destinataire ou de la direction de l'entreprise.",
      "中文：如果你的个人通信地址和出租活动地址不同，在这里填个人地址。",
      "Où trouver : avis d'impôt, espace particulier, courrier fiscal.",
    ],
  },
  contact: {
    title: "Mél / Téléphone · 邮箱/电话",
    body: [
      "Nom officiel : « Mél » et « Téléphone » sur la 2031-SD.",
      "中文：填写税局可以联系到你的邮箱和电话。",
      "Où trouver : espace professionnel或你希望税局使用的联系方式。",
    ],
  },
  activity_label: {
    title: "Activités exercées · 经营活动",
    body: [
      "Nom officiel : « Activités exercées (souligner l'activité principale) ».",
      "中文：LMNP 通常写 « Location meublée non professionnelle »，如有多项活动需列出并标明主要活动。",
      "Où trouver : SIRENE activité, déclaration de début d'activité, comptabilité.",
    ],
  },
  accounting_software: {
    title: "Comptabilité informatisée · 电子会计",
    body: [
      "Nom officiel : « L'entreprise dispose-t-elle d'une comptabilité informatisée ? Si oui, indication du logiciel utilisé ».",
      "中文：如果用 Excel、会计软件、专家会计师软件，都应按实际写出。",
      "Où trouver : 你的账务工具或 expert-comptable。",
    ],
  },
  securities_income: {
    title: "Revenus de valeurs et capitaux mobiliers · 证券及资本收入",
    body: [
      "Nom officiel : ligne 2 de la récapitulation 2031-SD.",
      "中文：一般单纯 LMNP 多数为 0；若企业结果中包含证券/资本收入才填。",
      "Où trouver : comptabilité BIC, annexes fiscales.",
    ],
  },
  exempt_income: {
    title: "Revenus exonérés · 免税收入",
    body: [
      "Nom officiel : cadre C, « revenus exonérés de l'impôt sur le revenu ».",
      "中文：普通 LMNP 长租通常为 0；只有符合免税/减免装置时才填。",
      "Où trouver : comptabilité和适用的 BOFiP/税局免税依据。",
    ],
  },
  capital_gains: {
    title: "Plus-values · 增值",
    body: [
      "Nom officiel : cadre 5 « Plus-values » et lignes 4bis / 4ter selon情况。",
      "中文：出售房产或资产时才可能涉及。LMNP 房产出售通常按 particuliers 的 plus-value immobilière 规则处理，2031 仍可能要求相关信息。",
      "Où trouver : acte de vente, calcul de plus-value, liasse fiscale, expert-comptable/notaire。",
    ],
  },
  owner_movements: {
    title: "Prélèvements / apports · 个人提取/投入资金",
    body: [
      "Nom officiel : 2031 Bis-SD cadre G Divers, « prélèvements personnels » et « apports en capital ou versements en compte courant ».",
      "中文：这不是租金，也不是费用。它只是说明你这个房东和出租活动之间的钱如何进出，通常影响资产负债表/compte de l'exploitant，不像维修费那样直接扣利润。",
      "真实例子 1：出租专用账户收到租金后，你转 2 000 € 到自己的日常银行卡买菜生活，这 2 000 € 是 prélèvements personnels。",
      "真实例子 2：热水器坏了，你用个人银行卡先付 800 € 维修费，或者你往出租专用账户打入 1 000 € 垫钱，这就是 apports / compte courant。",
      "Où trouver : relevés bancaires, compte de l'exploitant, écritures comptables ou tableau de suivi personnel.",
    ],
  },
  deductible_charges: {
    title: "Charges déductibles annuelles en EUR · 全年可扣费用",
    body: [
      "Nom officiel : charges supportées dans l'intérêt de l'activité BIC.",
      "中文：只填和出租活动直接相关、你实际承担且有凭证的费用。全部填全年欧元金额，不是百分比，不是每月金额。",
      "真实例子：物业每季度 appel de charges 400 €，一年 4 次，所以 charges de copropriété 填 1600。保险每年扣 180 €，assurance 填 180。",
      "Sources : impots.gouv.fr indique qu'au réel les charges réellement supportées sont déduites comptablement.",
    ],
  },
  cfe: {
    title: "CFE · Cotisation foncière des entreprises · 企业地产税",
    body: [
      "Nom officiel : Cotisation foncière des entreprises (CFE).",
      "中文：即使你是个人房东，只要做 location meublée，税局说明它对 CFE 来说属于 professionnelle；但有些情况可免，或者第一年/低收入/特定出租形式可能没有 avis。没有收到 CFE avis 时这里先填 0。",
      "在哪里找：登录 impots.gouv.fr 的 espace professionnel，不是 espace particulier。常见路径是 « Consulter > Avis C.F.E »，或 compte fiscal 里的 « Accès aux avis de CFE » / « Accès par impôt > Cotisation Foncière des Entreprises > Avis d'imposition »。",
      "真实例子：2025 年 avis CFE 显示 montant dû 220 €，这里填 220。若你的专业税务空间没有对应年份 avis，或者显示不需缴纳，就填 0 并保留截图/说明。",
      "Source officielle : impots.gouv.fr indique que les avis de CFE/IFER se consultent et se paient depuis l'espace professionnel.",
    ],
  },
  repairs_vs_works: {
    title: "Réparations, entretien, travaux · 维修与工程",
    body: [
      "中文：小修、维护通常可作为 charges；能增加价值或延长使用寿命的改善工程通常要 immobiliser puis amortir。",
      "Dans cet outil : « réparations / entretien » va en charges de l'année ; « travaux d'amélioration immobilisés » est amorti par défaut sur 10 ans.",
      "À vérifier : factures, nature exacte des travaux, date de mise en service.",
    ],
  },
  acquisition_price: {
    title: "Prix / valeur du bien · 房产价格/价值",
    body: [
      "中文：填房产本身的价格/价值，单位欧元。不是贷款金额，也不是首付金额。如果你买入后很快出租，可用购买价作基础；如果很久以后才开始 LMNP，常见做法是用开始出租时的市场价值并保留估值依据。",
      "真实例子：买房总价 200 000 €，贷款 160 000 €、首付 40 000 €。这里填房产价格 200000，不填贷款 160000。",
      "Important : le terrain n'est pas amortissable. Si tu ne renseignes pas la valeur du terrain, l'outil applique par prudence 15 % par défaut.",
      "Sources : l'amortissement suppose une inscription à l'actif ; les sites comptables spécialisés ventilent ensuite le bâti par composants.",
    ],
  },
  land_value: {
    title: "Valeur du terrain · 土地价值",
    body: [
      "中文：土地不折旧。需要从房产总价里剔除土地部分，只对建筑、家具、工程折旧。这里填欧元金额，不填百分比。",
      "在哪里找：先看 acte d'achat / acte authentique 有没有把 terrain 和 construction 分开；多数情况下没有。也可以问 notaire、expert-comptable，或保留估值依据。cadastre 能帮助识别地块，但通常不会直接给你可申报的土地价值。",
      "真实例子：房产价值 200 000 €，你和会计按当地情况把土地估为 30 000 €。这里填 30000，工具只对剩下约 170 000 € 的建筑部分做折旧。",
      "如果不知道，本工具默认按 15 % 估算土地；这只是草稿假设，不是税局固定比例，正式申报最好能保留解释依据。",
    ],
  },
  acquisition_fees: {
    title: "Frais d'acquisition · 购置费用",
    body: [
      "中文：公证费、中介费在会计上可能作为费用或计入资产后折旧，处理方式会影响亏损/递延折旧。",
      "Dans cet outil : par défaut ils sont ajoutés à la base amortissable du bâti hors terrain.",
      "À vérifier selon ta stratégie fiscale et ta comptabilité.",
    ],
  },
  service_start: {
    title: "Date de mise en service · 开始使用日期",
    body: [
      "Nom officiel comptable : date de mise en service de l'immobilisation.",
      "中文：第一年折旧要按时间比例 prorata temporis。通常是开始出租/可出租日期，不一定是购买日期。",
      "Où trouver : bail, annonce de mise en location, état des lieux, facture de mise en service.",
    ],
  },
  furniture_value: {
    title: "Mobilier et électroménager · 家具家电",
    body: [
      "中文：家具、家电通常单独折旧，本工具默认 7 年。不同物品可能 5 到 10 年，按实际使用寿命调整更严谨。",
      "Où trouver : inventaire du mobilier, factures, valeur estimée du mobilier existant à l'entrée en LMNP.",
    ],
  },
};

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrZero(value) {
  return numberOrNull(value) ?? 0;
}

function readForm() {
  const data = new FormData(form);
  return {
    tax_year: Number(data.get("tax_year")),
    fiscal_resident_france: data.get("fiscal_resident_france") === "on",
    furnished: data.get("furnished") === "on",
    rental_kind: data.get("rental_kind"),
    receipts: numberOrZero(data.get("receipts")),
    receipts_previous_year: numberOrNull(data.get("receipts_previous_year")),
    receipts_two_years_prior: numberOrNull(data.get("receipts_two_years_prior")),
    other_activity_income: numberOrZero(data.get("other_activity_income")),
    in_principal_home: data.get("in_principal_home") === "on",
    tenant_main_or_seasonal_residence: data.get("tenant_main_or_seasonal_residence") === "on",
    reasonable_rent: data.get("reasonable_rent") === "on",
    has_siret: data.get("has_siret") === "on",
    first_year_activity: data.get("first_year_activity") === "on",
    regime_choice: data.get("regime_choice"),
    real_taxable_result: numberOrNull(data.get("real_taxable_result")),
    charges: numberOrZero(data.get("charges")),
    depreciation: numberOrZero(data.get("depreciation")),
    property_address: String(data.get("property_address") || ""),
    acquisition_price: numberOrZero(data.get("acquisition_price")),
    land_value: numberOrZero(data.get("land_value")),
    notary_fees: numberOrZero(data.get("notary_fees")),
    agency_fees: numberOrZero(data.get("agency_fees")),
    building_service_start: String(data.get("building_service_start") || ""),
    furniture_value: numberOrZero(data.get("furniture_value")),
    furniture_service_start: String(data.get("furniture_service_start") || ""),
    works_improvement: numberOrZero(data.get("works_improvement")),
    works_service_start: String(data.get("works_service_start") || ""),
    loan_interest: numberOrZero(data.get("loan_interest")),
    property_tax: numberOrZero(data.get("property_tax")),
    insurance: numberOrZero(data.get("insurance")),
    condo_fees: numberOrZero(data.get("condo_fees")),
    repairs_maintenance: numberOrZero(data.get("repairs_maintenance")),
    cfe: numberOrZero(data.get("cfe")),
    accounting_fees: numberOrZero(data.get("accounting_fees")),
    other_deductible_charges: numberOrZero(data.get("other_deductible_charges")),
    siren: String(data.get("siren") || ""),
    siret: String(data.get("siret") || ""),
    business_name: String(data.get("business_name") || ""),
    business_address: String(data.get("business_address") || ""),
    declarant_address: String(data.get("declarant_address") || ""),
    email: String(data.get("email") || ""),
    phone: String(data.get("phone") || ""),
    activity_label: String(data.get("activity_label") || ""),
    exercise_opened_on: String(data.get("exercise_opened_on") || ""),
    exercise_closed_on: String(data.get("exercise_closed_on") || ""),
    computerized_accounting: data.get("computerized_accounting") === "on",
    accounting_software: String(data.get("accounting_software") || ""),
    securities_income: numberOrZero(data.get("securities_income")),
    short_term_capital_gain: numberOrZero(data.get("short_term_capital_gain")),
    long_term_capital_gain_128: numberOrZero(data.get("long_term_capital_gain_128")),
    exempt_income: numberOrZero(data.get("exempt_income")),
    personal_withdrawals: numberOrZero(data.get("personal_withdrawals")),
    capital_contributions: numberOrZero(data.get("capital_contributions")),
  };
}

function money(value) {
  const locale = { fr: "fr-FR", zh: "zh-CN", en: "en-US", ar: "ar" }[currentLanguage] || "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

function yearUnit() {
  return { fr: "ans", zh: "年", en: "years", ar: "سنوات" }[currentLanguage] || "years";
}

function displayClassification(value) {
  const labels = {
    LMNP: ["LMNP · Loueur en meublé non professionnel", "非职业性带家具出租", "Non-professional furnished rental", "تأجير مفروش غير مهني"],
    "Possible LMP": ["LMP possible · Loueur en meublé professionnel possible", "可能属于职业性带家具出租", "Possible professional furnished rental", "قد يكون تأجيراً مفروشاً مهنياً"],
    "Exempt furnished rental income": ["Exonération possible", "带家具出租收入可能免税", "Possible exemption", "إعفاء محتمل"],
    "Not LMNP": ["Hors champ LMNP", "不属于 LMNP", "Outside LMNP scope", "خارج نطاق LMNP"],
  };
  return labels[value] ? languageText(labels[value]) : value;
}

function displayRegime(value) {
  const labels = {
    "micro-BIC": ["Micro-BIC", "Micro-BIC", "Micro-BIC", "Micro-BIC"],
    reel: ["Régime réel", "实际制度", "Real regime", "النظام الفعلي"],
    exempt: ["Exonération", "免税", "Exemption", "الإعفاء"],
    none: ["Aucun", "无", "None", "لا شيء"],
  };
  return labels[value] ? languageText(labels[value]) : value;
}

function escapeHtml(value) {
  if (value && typeof value === "object") value = localizedValue(value);
  value = localizeDisplayText(value);
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function localizeDisplayText(value) {
  if (typeof value !== "string") return value;
  const separator = value.includes(" · ") ? " · " : value.includes(" Â· ") ? " Â· " : null;
  if (!separator) return value;
  const [primary, ...rest] = value.split(separator);
  if (currentLanguage === "zh" && rest.length) return rest.join(separator).trim();
  return primary.trim();
}

function localizedValue(value) {
  if (Array.isArray(value)) return value.map(localizedValue);
  if (!value || typeof value !== "object") return value;
  const languages = ["fr", "zh", "en", "ar"];
  const keys = Object.keys(value);
  const isLanguageMap = keys.length > 0 && keys.every((key) => languages.includes(key));
  if (isLanguageMap) return value[currentLanguage] ?? value.en ?? value.fr ?? value.zh ?? value.ar ?? "";
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizedValue(item)]));
}

function renderServiceCards() {
  const lmnp = moduleCardCopy("lmnp");
  const serviceCardsHtml = localServices
    .map((rawService) => {
      const service = moduleCardCopy(rawService.id) || localizedService(rawService);
      return `
        <a class="service-card" href="#${escapeHtml(rawService.id)}" data-module="${escapeHtml(rawService.id)}">
          <strong>${escapeHtml(service.title)}</strong>
          <small>${escapeHtml(service.subtitle)}</small>
          <p>${escapeHtml(service.summary)}</p>
        </a>
      `;
    })
    .join("");
  serviceCards.innerHTML = `
    <a class="service-card service-card-primary" href="#lmnp" data-module="lmnp">
      <strong>${escapeHtml(lmnp.title)}</strong>
      <small>${escapeHtml(lmnp.subtitle)}</small>
      <p>${escapeHtml(lmnp.summary)}</p>
    </a>
    ${serviceCardsHtml}
  `;
}

function renderList(items = []) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderStepBlocks(steps = []) {
  if (!steps.length) return "";
  const ui = serviceUi[currentLanguage];
  return `
    <h3>${escapeHtml(ui.guide)}</h3>
    <div class="step-list">
      ${steps
        .map(
          (step) => `
            <article class="step-block">
              <h4>${escapeHtml(step.title)}</h4>
              ${step.goal ? `<p class="muted">${escapeHtml(step.goal)}</p>` : ""}
              ${step.actions?.length ? `<strong>${escapeHtml(ui.actions)}</strong><ol>${renderList(step.actions)}</ol>` : ""}
              ${step.documents?.length ? `<strong>${escapeHtml(ui.documents)}</strong><ul>${renderList(step.documents)}</ul>` : ""}
              ${step.outputs?.length ? `<strong>${escapeHtml(ui.outputs)}</strong><ul>${renderList(step.outputs)}</ul>` : ""}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTracks(tracks = []) {
  if (!tracks.length) return "";
  const ui = serviceUi[currentLanguage];
  return `
    <h3>${escapeHtml(ui.tracks)}</h3>
    <div class="track-list">
      ${tracks
        .map(
          (track) => `
            <article class="track-block">
              <h4>${escapeHtml(track.title)}</h4>
              <p class="muted">${escapeHtml(track.subtitle)}</p>
              <p>${escapeHtml(track.when_to_use)}</p>
              <strong>${escapeHtml(ui.procedure)}</strong>
              <ol>${renderList(track.steps)}</ol>
              <strong>${escapeHtml(ui.coreDocuments)}</strong>
              <ul>${renderList(track.documents)}</ul>
              ${track.risk_points?.length ? `<strong>${escapeHtml(ui.risks)}</strong><ul>${renderList(track.risk_points)}</ul>` : ""}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCivicTraining(training) {
  if (!training) return "";
  return `
    <h3>${escapeHtml(training.title)}</h3>
    <div class="civic-box">
      <p>${escapeHtml(training.summary)}</p>
      <a href="${escapeHtml(training.official_course.url)}" target="_blank" rel="noreferrer">
        ${escapeHtml(training.official_course.label)}
      </a>
      <p class="muted">${escapeHtml(training.official_course.note)}</p>
    </div>
  `;
}

function renderOfficialLinks(links = []) {
  if (!links.length) return "";
  const ui = serviceUi[currentLanguage];
  return `
    <h3>${escapeHtml(ui.officialLinks)}</h3>
    <div class="official-links">
      ${links
        .map(
          (link) => `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
              <strong>${escapeHtml(link.label)}</strong>
              <span>${escapeHtml(link.note)}</span>
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderLandlordGuide() {
  const copy = landlordGuideUi[currentLanguage] || landlordGuideUi.en;
  const target = document.querySelector("#landlord-guide");
  target.innerHTML = `
    <h2>${escapeHtml(copy.title)}</h2>
    <p>${escapeHtml(copy.intro)}</p>
    <h3>${escapeHtml(copy.siretTitle)}</h3>
    <ol>${renderList(copy.items)}</ol>
    <div class="official-links">
      <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F32744" target="_blank" rel="noreferrer">
        <strong>${escapeHtml(copy.link)}</strong>
        <span>service-public.gouv.fr</span>
      </a>
      <a href="https://www.impots.gouv.fr/particulier/les-locations-meublees" target="_blank" rel="noreferrer">
        <strong>impots.gouv.fr · SIRET</strong>
        <span>Immatriculation des loueurs en meublé</span>
      </a>
    </div>
  `;
  const officialCopy = {
    fr: ["Impots.gouv.fr · SIRET", "Immatriculation des loueurs en meublé"],
    zh: ["impots.gouv.fr · SIRET", "带家具出租房东登记"],
    en: ["Impots.gouv.fr · SIRET", "Registration of furnished-rental landlords"],
    ar: ["impots.gouv.fr · SIRET", "تسجيل المؤجرين في التأجير المفروش"],
  }[currentLanguage] || ["Impots.gouv.fr · SIRET", "Furnished-rental registration"];
  const officialLink = target.querySelector(".official-links a:nth-child(2)");
  if (officialLink) {
    officialLink.querySelector("strong").textContent = officialCopy[0];
    officialLink.querySelector("span").textContent = officialCopy[1];
  }
}

function renderSiretResultIntro() {
  const copy = landlordGuideUi[currentLanguage] || landlordGuideUi.en;
  return `
    <div class="warn">
      <strong>${escapeHtml(copy.siretTitle)}</strong>
      <ol>${renderList(copy.items)}</ol>
    </div>
  `;
}

function renderLmnpOfficialLink() {
  const titles = {
    fr: "Explication officielle",
    zh: "官方讲解",
    en: "Official explanation",
    ar: "شرح رسمي",
  };
  const linkLabels = {
    fr: "Service-Public - Revenus d'une location meublée",
    zh: "Service-Public：带家具出租收入",
    en: "Service-Public - Furnished-rental income",
    ar: "Service-Public - دخل التأجير المفروش",
  };
  document.querySelector("#source-search").innerHTML = `
    <h2>${escapeHtml(titles[currentLanguage])}</h2>
    <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F32744" target="_blank" rel="noreferrer">
      ${escapeHtml(linkLabels[currentLanguage])}
    </a>
  `;
}

function renderServiceDetail(service) {
  const checklist = renderList(service.checklist);
  const ui = serviceUi[currentLanguage];
  serviceDetail.innerHTML = `
    <h2>${escapeHtml(service.title)}</h2>
    <p class="muted">${escapeHtml(service.subtitle)}</p>
    <p>${escapeHtml(service.summary)}</p>
    <div class="warn">${escapeHtml(service.offline_notice)}</div>
    <h3>${escapeHtml(ui.audience)}</h3>
    <p>${escapeHtml(service.audience)}</p>
    <h3>${escapeHtml(ui.checklist)}</h3>
    <ol>${checklist}</ol>
    ${renderStepBlocks(service.steps)}
    ${renderTracks(service.tracks)}
    ${renderCivicTraining(service.civic_training)}
    ${renderOfficialLinks(service.official_links)}
  `;
}

async function loadServices() {
  try {
    const response = await fetch(`${api}/api/services`);
    localServices = await response.json();
    renderServiceCards();
    renderModuleNav();
    route();
  } catch {
    serviceCards.innerHTML = '<div class="warn">Impossible de charger la base locale des services · 无法读取本地服务数据库</div>';
  }
}

function renderModuleNav() {
  const ui = serviceUi[currentLanguage];
  moduleNav.innerHTML = `
    <a href="#home" data-module="home">${escapeHtml(ui.home)}</a>
    <a href="#lmnp" data-module="lmnp">${escapeHtml(moduleCardCopy("lmnp").nav)}</a>
    ${localServices
      .map((service) => {
        const copy = moduleCardCopy(service.id) || localizedService(service);
        return `<a href="#${escapeHtml(service.id)}" data-module="${escapeHtml(service.id)}">${escapeHtml(copy.nav || copy.title)}</a>`;
      })
      .join("")}
  `;
}

function refreshModuleLanguage() {
  if (!localServices.length) return;
  renderServiceCards();
  renderModuleNav();
  route();
}

function route() {
  const moduleId = currentModuleId();
  const isLmnp = moduleId === "lmnp";
  const service = localServices.find((item) => item.id === moduleId);
  updateHeaderIntro(moduleId);
  serviceHome.hidden = moduleId !== "home" && moduleId !== "";
  lmnpPage.hidden = !isLmnp;
  serviceDetail.hidden = !service;
  if (service) renderServiceDetail(localizedService(service));
  moduleNav.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("active", link.dataset.module === (moduleId || "home"));
  });
  serviceCards.querySelectorAll(".service-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.module === (moduleId || "home"));
  });
}

function renderResult(result) {
  lastResult = result;
  const warnings = result.warnings
    .map((warning) => `<div class="warn">${escapeHtml(warning)}</div>`)
    .join("");
  const steps = result.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const rows = result.copy_sheet
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.form)}</td>
          <td>${escapeHtml(row.section)}</td>
          <td>${escapeHtml(row.field)}</td>
          <td><strong>${escapeHtml(row.value)}</strong></td>
          <td>${escapeHtml(row.note)}</td>
        </tr>
      `,
    )
    .join("");
  const citations = result.citations
    .map(
      (source) => `
        <div class="source">
          <strong>${escapeHtml(source.publisher)}</strong> ·
          <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a>
          <span class="muted">${resultCopy("checked")} ${escapeHtml(source.checked_at)}</span>
        </div>
      `,
    )
    .join("");
  const form2031Rows = (result.form_2031 || [])
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.page)}</td>
          <td>${escapeHtml(row.cadre)}</td>
          <td>${escapeHtml(row.rubrique)}</td>
          <td><strong>${escapeHtml(row.valeur)}</strong></td>
          <td>${escapeHtml(row.explication)}</td>
        </tr>
      `,
    )
    .join("");
  const form2031 = form2031Rows
    ? `
      <h3>${resultCopy("form2031")}</h3>
      <table>
        <thead>
          <tr><th>${resultCopy("page")}</th><th>${resultCopy("frame")}</th><th>${resultCopy("line")}</th><th>${resultCopy("fillIn")}</th><th>${resultCopy("explanation")}</th></tr>
        </thead>
        <tbody>${form2031Rows}</tbody>
      </table>
    `
    : "";
  const accountingRows = (result.accounting_summary || [])
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.libelle)}</td>
          <td><strong>${row.valeur === "" ? "" : money(row.valeur)}</strong></td>
          <td>${escapeHtml(row.explication)}</td>
        </tr>
      `,
    )
    .join("");
  const depreciationRows = (result.debug?.real_calc?.depreciation_rows || [])
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.component)}</td>
          <td>${money(row.base)}</td>
          <td>${escapeHtml(row.years)} ${escapeHtml(yearUnit())}</td>
          <td>${escapeHtml(row.prorata)}</td>
          <td><strong>${money(row.annual_amount)}</strong></td>
        </tr>
      `,
    )
    .join("");
  const accounting = accountingRows
    ? `
      <h3>${resultCopy("accounting")}</h3>
      <table>
        <thead><tr><th>${resultCopy("item")}</th><th>${resultCopy("amount")}</th><th>${resultCopy("explanation")}</th></tr></thead>
        <tbody>${accountingRows}</tbody>
      </table>
      <h3>${resultCopy("depreciation")}</h3>
      <table>
        <thead><tr><th>${resultCopy("component")}</th><th>${resultCopy("base")}</th><th>${resultCopy("duration")}</th><th>${resultCopy("prorata")}</th><th>${resultCopy("annualDepreciation")}</th></tr></thead>
        <tbody>${depreciationRows || `<tr><td colspan="5">${escapeHtml(resultCopy("noAssets"))}</td></tr>`}</tbody>
      </table>
    `
    : "";

  output.className = "";
  output.innerHTML = `
    <div class="summary">
      <div class="metric"><span>${resultCopy("qualification")}</span><strong>${escapeHtml(displayClassification(result.classification))}</strong></div>
      <div class="metric"><span>${resultCopy("regime")}</span><strong>${escapeHtml(displayRegime(result.regime))}</strong></div>
      <div class="metric"><span>${resultCopy("basis")}</span><strong>${money(result.taxable_basis)}</strong></div>
    </div>
    ${renderSiretResultIntro()}
    ${warnings}
    <h3>${resultCopy("steps")}</h3>
    <ol>${steps}</ol>
    <h3>${resultCopy("copy")}</h3>
    <table>
      <thead>
        <tr><th>${resultCopy("official")}</th><th>${resultCopy("section")}</th><th>${resultCopy("field")}</th><th>${resultCopy("value")}</th><th>${resultCopy("note")}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${accounting}
    ${form2031}
    <h3>${resultCopy("sources")}</h3>
    ${citations}
  `;
}

async function evaluate(event) {
  event.preventDefault();
  output.className = "empty";
  output.textContent = languageUi[currentLanguage].calculating;
  const response = await fetch(`${api}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readForm()),
  });
  if (!response.ok) {
    output.textContent = languageUi[currentLanguage].error;
    return;
  }
  renderResult(await response.json());
}

async function checkHealth() {
  if (!health) return;
  try {
    const response = await fetch(`${api}/api/health`);
    const data = await response.json();
    health.textContent = data.ok ? "" : languageUi[currentLanguage].offline;
  } catch {
    health.textContent = languageUi[currentLanguage].server;
  }
}

async function searchCorpus() {
  searchResults.textContent = languageUi[currentLanguage].calculating;
  const response = await fetch(`${api}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: searchQuery.value, limit: 5 }),
  });
  const hits = await response.json();
  searchResults.innerHTML = hits
    .map(
      (hit) => `
      <article>
        <strong>${escapeHtml(hit.title)}</strong>
        <div class="muted">${escapeHtml(hit.publisher)} · score ${escapeHtml(hit.score)}</div>
        <p>${escapeHtml(hit.excerpt)}</p>
        <a href="${escapeHtml(hit.url)}" target="_blank" rel="noreferrer">${escapeHtml(languageUi[currentLanguage].source)}</a>
      </article>
    `,
    )
    .join("");
}

function openHelp(key) {
  const item = helpTexts[key];
  if (!item) return;
  helpTitle.textContent = fieldTranslations[key] ? languageText(fieldTranslations[key]) : item.title;
  helpBody.innerHTML = localizeHelp(key, item).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  helpDialog.showModal();
}

const languageSelect = document.querySelector("#language-select");
const languageLabel = document.querySelector("#language-label");
const savedLanguage = localStorage.getItem("auto-decla-language");
const supportedLanguages = new Set(["fr", "zh", "en", "ar"]);
const queryLanguage = new URLSearchParams(window.location.search).get("lang");
let currentLanguage = supportedLanguages.has(queryLanguage)
  ? queryLanguage
  : supportedLanguages.has(savedLanguage)
    ? savedLanguage
  : languageSelect?.value || "fr";

const languageUi = {
  fr: {
    language: "Langue", assistant: "Assistant local pour la déclaration LMNP", health: "Vérification", form: "Informations de déclaration", result: "Résultat", searchTitle: "Recherche dans les sources officielles locales", search: "Rechercher", generate: "Générer l'aide de déclaration", empty: "Remplissez les informations à gauche puis générez le résultat.", calculating: "Calcul en cours...", error: "Erreur pendant le calcul.", local: "local", offline: "Hors ligne", server: "Serveur indisponible", source: "Source officielle", verified: "Vérifié",
    legends: ["Situation et formalités", "Exonération résidence principale", "Régime réel : brouillon rapide", "Régime réel : charges déductibles annuelles en EUR", "Régime réel : amortissements par composants", "2031-SD : informations à reporter"],
  },
  zh: {
    language: "Langue · 语言", assistant: "Assistant local pour la déclaration LMNP · 本地 LMNP 申报辅助工具", health: "Vérification · 检查中", form: "Informations de déclaration · 申报信息", result: "Résultat · 结果", searchTitle: "Recherche dans les sources officielles locales · 本地官方资料检索", search: "Rechercher · 搜索", generate: "Générer l'aide de déclaration · 生成申报指引", empty: "Remplissez les informations à gauche puis générez le résultat。· 填写左侧信息后生成。", calculating: "Calcul en cours · 正在计算...", error: "Erreur pendant le calcul · 计算时出错。", local: "本地", offline: "Hors ligne · 离线", server: "Serveur indisponible · 后端不可用", source: "Source officielle · 官方来源", verified: "Vérifié · 已核对",
    legends: ["Situation et formalités · 身份与手续", "Exonération résidence principale · 主住宅内出租免税判断", "Régime réel : brouillon rapide · 实际制度快速草稿", "Régime réel : charges déductibles annuelles en EUR · 实际制度全年可扣费用（欧元）", "Régime réel : amortissements par composants · 按组件折旧", "2031-SD : informations à reporter · 2031 表逐项信息"],
  },
  en: {
    language: "Language", assistant: "Local assistant for the LMNP declaration", health: "Checking", form: "Declaration information", result: "Result", searchTitle: "Search local official sources", search: "Search", generate: "Generate declaration guide", empty: "Fill in the information on the left, then generate the result.", calculating: "Calculating...", error: "An error occurred during calculation.", local: "local", offline: "Offline", server: "Server unavailable", source: "Official source", verified: "Verified",
    legends: ["Situation and formalities", "Main-home rental exemption", "Real regime: quick draft", "Real regime: annual deductible expenses in EUR", "Real regime: component depreciation", "2031-SD: information to report"],
  },
  ar: {
    language: "اللغة", assistant: "مساعد محلي لإقرار LMNP", health: "جارٍ التحقق", form: "معلومات الإقرار", result: "النتيجة", searchTitle: "البحث في المصادر الرسمية المحلية", search: "بحث", generate: "إنشاء دليل الإقرار", empty: "أدخل المعلومات في اليسار ثم أنشئ النتيجة.", calculating: "جارٍ الحساب...", error: "حدث خطأ أثناء الحساب.", local: "محلي", offline: "غير متصل", server: "الخادم غير متاح", source: "مصدر رسمي", verified: "تم التحقق",
    legends: ["الوضع والإجراءات", "إعفاء تأجير المسكن الرئيسي", "النظام الفعلي: مسودة سريعة", "النظام الفعلي: المصاريف السنوية القابلة للخصم باليورو", "النظام الفعلي: إهلاك المكونات", "2031-SD: المعلومات المطلوب نقلها"],
  },
};

Object.assign(languageUi.zh, {
  language: "语言",
  assistant: "本地 LMNP 申报辅助工具",
  health: "检查中",
  form: "申报信息",
  result: "结果",
  searchTitle: "本地官方资料检索",
  search: "搜索",
  generate: "生成申报指引",
  empty: "填写左侧信息后生成。",
  calculating: "正在计算...",
  error: "计算时出错。",
  offline: "离线",
  server: "后端不可用",
  source: "官方来源",
  verified: "已核对",
  legends: ["身份与手续", "主住房内出租免税判断", "实际制度：快速草稿", "实际制度：全年可扣费用（欧元）", "实际制度：按组件折旧", "2031-SD：需要填写的信息"],
});

const resultTranslations = {
  qualification: ["Qualification", "类型判断", "Classification", "التصنيف"], regime: ["Régime", "计税制度", "Tax regime", "النظام الضريبي"], basis: ["Base estimée", "估算税基", "Estimated taxable basis", "الوعاء التقديري"], steps: ["Étapes", "步骤", "Steps", "الخطوات"], copy: ["Feuille à recopier", "可复制到申报页面的信息", "Copy sheet", "ورقة النقل إلى الإقرار"], sources: ["Sources officielles locales", "本地官方来源", "Local official sources", "المصادر الرسمية المحلية"], form2031: ["2031-SD pas à pas", "2031-SD 逐格填写", "2031-SD step by step", "2031-SD خطوة بخطوة"], accounting: ["Calcul comptable régime réel", "实际制度会计计算", "Real-regime accounting calculation", "الحساب المحاسبي للنظام الفعلي"], depreciation: ["Tableau d'amortissement", "折旧表", "Depreciation schedule", "جدول الإهلاك"], item: ["Élément", "项目", "Item", "العنصر"], amount: ["Montant", "金额", "Amount", "المبلغ"], explanation: ["Explication", "说明", "Explanation", "الشرح"], official: ["Formulaire", "表格", "Form", "النموذج"], section: ["Rubrique", "栏目", "Section", "القسم"], field: ["Case / champ", "格号/字段", "Box / field", "الخانة / الحقل"], value: ["Valeur", "数值", "Value", "القيمة"], note: ["Note", "说明", "Note", "ملاحظة"], page: ["Page", "页码", "Page", "الصفحة"], frame: ["Cadre", "框", "Frame", "الإطار"], line: ["Rubrique", "行/字段", "Line / field", "البند / الحقل"], fillIn: ["À inscrire", "填写", "To enter", "ما يكتب"], component: ["Composant", "组件", "Component", "المكوّن"], base: ["Base", "基数", "Base", "الأساس"], duration: ["Durée", "年限", "Duration", "المدة"], prorata: ["Prorata", "按比例", "Prorata", "النسبة"], annualDepreciation: ["Dotation annuelle", "年度折旧", "Annual depreciation", "الإهلاك السنوي"], noAssets: ["Aucune immobilisation renseignée", "尚未填写资产信息", "No asset entered", "لم يتم إدخال أي أصل"], checked: ["Vérifié", "已核对", "Checked", "تم التحقق"]
};

function resultCopy(key) {
  const values = resultTranslations[key];
  return values[{ fr: 0, zh: 1, en: 2, ar: 3 }[currentLanguage] ?? 0];
}

const fieldTranslations = {
  tax_year: ["Année des revenus", "收入年份", "Income year", "سنة الدخل"], rental_kind: ["Nature de la location", "出租类型", "Rental type", "نوع الإيجار"], receipts: ["Recettes brutes annuelles TTC", "年含税总收入", "Annual gross receipts incl. tax", "الإيرادات الإجمالية السنوية شامل الضريبة"], other_activity_income: ["Autres revenus d'activité du foyer fiscal", "税户其他职业收入", "Other household employment income", "دخل العمل الآخر للأسرة الضريبية"], receipts_previous_year: ["Recettes N-1", "上一年收入", "Previous-year receipts", "إيرادات السنة السابقة"], receipts_two_years_prior: ["Recettes N-2", "前两年收入", "Receipts from two years ago", "إيرادات ما قبل سنتين"], regime_choice: ["Régime d'imposition", "计税制度", "Tax regime", "النظام الضريبي"], property_address: ["Adresse de la location", "出租房地址", "Rental property address", "عنوان العقار المؤجر"], real_taxable_result: ["Résultat fiscal déjà calculé", "已算出的税务结果", "Already-calculated tax result", "النتيجة الضريبية المحسوبة"], charges: ["Charges déductibles annuelles en EUR", "全年可扣费用金额（欧元）", "Annual deductible expenses in EUR", "المصاريف السنوية القابلة للخصم باليورو"], depreciation: ["Amortissements", "折旧", "Depreciation", "الإهلاك"], loan_interest: ["Intérêts d'emprunt payés dans l'année, EUR", "本年已付贷款利息金额，不是利率", "Loan interest paid during the year, EUR", "فوائد القرض المدفوعة خلال السنة باليورو"], property_tax: ["Taxe foncière annuelle, EUR", "年度房产税金额", "Annual property tax, EUR", "الضريبة العقارية السنوية باليورو"], insurance: ["Assurance annuelle, EUR", "年度保险金额", "Annual insurance, EUR", "التأمين السنوي باليورو"], condo_fees: ["Charges de copropriété annuelles, EUR", "全年物业/共管费用", "Annual condominium charges, EUR", "رسوم الملكية المشتركة السنوية باليورو"], repairs_maintenance: ["Réparations / entretien annuels, EUR", "全年维修保养金额", "Annual repairs / maintenance, EUR", "الإصلاح والصيانة السنوية باليورو"], cfe: ["CFE annuelle si avis reçu, EUR", "收到 CFE 通知才填年度金额", "Annual CFE if an assessment was issued, EUR", "مبلغ CFE السنوي إذا صدر إشعار"], accounting_fees: ["Frais comptables annuels, EUR", "全年会计费用", "Annual accounting fees, EUR", "أتعاب المحاسبة السنوية باليورو"], other_deductible_charges: ["Autres charges justifiées annuelles, EUR", "其他全年有凭证费用", "Other documented annual expenses, EUR", "مصاريف سنوية أخرى موثقة باليورو"], acquisition_price: ["Prix / valeur du bien", "房产价格/价值", "Property price / value", "سعر العقار أو قيمته"], land_value: ["Valeur du terrain non amortissable, EUR", "不折旧的土地价值", "Non-depreciable land value, EUR", "قيمة الأرض غير القابلة للإهلاك"], notary_fees: ["Frais de notaire", "公证费", "Notary fees", "رسوم التوثيق"], agency_fees: ["Frais d'agence", "中介费", "Agency fees", "رسوم الوكالة"], building_service_start: ["Date de mise en location / service du bien", "房产开始出租/使用日期", "Rental / in-service date", "تاريخ بدء التأجير أو الاستخدام"], furniture_value: ["Mobilier et électroménager", "家具家电价值", "Furniture and appliances", "الأثاث والأجهزة"], furniture_service_start: ["Date mobilier", "家具开始使用日期", "Furniture in-service date", "تاريخ بدء استخدام الأثاث"], works_improvement: ["Travaux d'amélioration immobilisés", "资本化改善工程", "Capitalized improvement works", "أعمال التحسين المرسملة"], works_service_start: ["Date travaux", "工程开始使用日期", "Works in-service date", "تاريخ بدء استخدام الأعمال"], exercise_opened_on: ["Exercice ouvert le", "会计年度开始日", "Financial year starts", "بداية السنة المالية"], exercise_closed_on: ["Exercice clos le", "会计年度结束日", "Financial year ends", "نهاية السنة المالية"], siren: ["SIREN", "9 位企业号", "9-digit business number", "رقم الشركة من 9 أرقام"], siret: ["SIRET", "14 位机构号", "14-digit establishment number", "رقم المنشأة من 14 رقماً"], business_name: ["Dénomination de l'entreprise", "企业/活动名称", "Business / activity name", "اسم النشاط أو الشركة"], business_address: ["Adresse de l'entreprise", "活动地址", "Business address", "عنوان النشاط"], declarant_address: ["Adresse du déclarant", "申报人地址", "Declarant address", "عنوان مقدم الإقرار"], email: ["Mél", "邮箱", "Email", "البريد الإلكتروني"], phone: ["Téléphone", "电话", "Telephone", "الهاتف"], activity_label: ["Activités exercées", "经营活动", "Activities carried out", "الأنشطة الممارسة"], accounting_software: ["Logiciel utilisé", "使用的软件", "Accounting software used", "برنامج المحاسبة المستخدم"], securities_income: ["Revenus de valeurs mobilières", "证券/资本收入", "Income from securities", "دخل الأوراق المالية"], exempt_income: ["Revenus exonérés", "免税收入", "Exempt income", "الدخل المعفى"], short_term_capital_gain: ["Plus-value court terme", "短期增值", "Short-term capital gain", "ربح رأسمالي قصير الأجل"], long_term_capital_gain_128: ["Plus-value long terme 12,8 %", "长期增值", "Long-term capital gain 12.8%", "ربح رأسمالي طويل الأجل 12.8٪"], personal_withdrawals: ["Prélèvements personnels annuels, EUR", "全年从出租账户拿回自己用的钱", "Annual personal withdrawals, EUR", "السحوبات الشخصية السنوية"], capital_contributions: ["Apports / compte courant annuels, EUR", "全年自己垫付或打入出租活动的钱", "Annual contributions / current account, EUR", "المساهمات السنوية أو الحساب الجاري"]
};

const checkboxTranslations = {
  fiscal_resident_france: ["Résident fiscal de France", "法国税务居民", "French tax resident", "مقيم ضريبي في فرنسا"], furnished: ["Logement loué meublé", "带家具出租", "Furnished rental", "تأجير مفروش"], has_siret: ["Numéro SIRET déjà obtenu", "已有 SIRET", "SIRET number already obtained", "تم الحصول على رقم SIRET"], first_year_activity: ["Première année d'activité", "第一年出租", "First year of activity", "السنة الأولى للنشاط"], in_principal_home: ["Les pièces font partie de ma résidence principale", "房间属于我的主住宅", "The rooms are part of my main home", "الغرف جزء من مسكني الرئيسي"], tenant_main_or_seasonal_residence: ["Résidence principale du locataire ou séjour saisonnier admissible", "租客主住宅或符合条件的季节性居住", "Tenant's main residence or eligible seasonal stay", "المسكن الرئيسي للمستأجر أو إقامة موسمية مؤهلة"], reasonable_rent: ["Prix de location fixé dans des limites raisonnables", "租金在官方合理限额内", "Rent set within reasonable limits", "الإيجار ضمن الحدود المعقولة"], computerized_accounting: ["Comptabilité informatisée", "使用电子会计", "Computerized accounting", "محاسبة إلكترونية"]
};

function languageText(values) {
  return values[{ fr: 0, zh: 1, en: 2, ar: 3 }[currentLanguage] ?? 0];
}

function languageUiText(key) {
  return languageUi[currentLanguage]?.[key] ?? languageUi.en?.[key] ?? languageUi.fr?.[key] ?? "";
}

function languageUiLegend(index) {
  return languageUi[currentLanguage]?.legends?.[index] ?? languageUi.en?.legends?.[index] ?? languageUi.fr?.legends?.[index] ?? "";
}

function localizeHelp(key, item) {
  const field = fieldTranslations[key];
  const label = field ? languageText(field) : item.title.split(" · ")[0];
  const guidance = {
    fr: "Consultez les documents officiels et conservez les justificatifs. Les règles peuvent dépendre de votre situation.",
    zh: "请核对官方文件并保留凭证。具体规则可能因你的个人情况而不同。",
    en: "Check the official documents and keep supporting records. The rules may depend on your situation.",
    ar: "راجع المستندات الرسمية واحتفظ بالمستندات المؤيدة. قد تختلف القواعد حسب وضعك.",
  };
  const frenchOfficial = item.body.filter((line) => line.startsWith("Nom officiel") || line.startsWith("Termes officiels") || line.startsWith("Où trouver") || line.startsWith("Source officielle") || line.startsWith("Sources"));
  return [label, guidance[currentLanguage], ...frenchOfficial];
}

function applyLanguage() {
  const ui = languageUi[currentLanguage];
  const app = appUi[currentLanguage];
  const servicesUi = serviceUi[currentLanguage];
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  document.title = app.title;
  languageSelect.value = currentLanguage;
  languageLabel.textContent = languageUiText("language");
  document.querySelector(".topbar h1").textContent = app.title;
  updateHeaderIntro();
  document.querySelector("form h2").textContent = languageUiText("form");
  const serviceHomeTitle = document.querySelector("#service-home h2");
  const serviceHomeNote = document.querySelector("#service-home .field-note");
  if (serviceHomeTitle) serviceHomeTitle.textContent = servicesUi.serviceHomeTitle;
  if (serviceHomeNote) serviceHomeNote.textContent = servicesUi.serviceHomeNote;
  document.querySelector(".result h2").textContent = languageUiText("result");
  document.querySelector("#source-search h2").textContent = languageUiText("searchTitle");
  document.querySelector("#search-btn").textContent = languageUiText("search");
  document.querySelector("form > button[type=submit]").textContent = languageUiText("generate");
  document.querySelector("#output").textContent = languageUiText("empty");
  document.querySelectorAll("form fieldset legend").forEach((legend, index) => {
    const text = languageUiLegend(index);
    if (text) legend.textContent = text;
  });
  document.querySelectorAll("label").forEach((label) => {
    const control = label.querySelector("input[name], select[name]");
    if (!control) return;
    const values = fieldTranslations[control.name];
    if (values) {
      const target = label.querySelector(".label-line > span:first-child");
      if (target) target.textContent = languageText(values);
    }
    const checks = checkboxTranslations[control.name];
    if (checks) {
      const info = label.querySelector("button");
      const checkbox = label.querySelector('input[type="checkbox"]');
      const text = document.createTextNode(` ${languageText(checks)}`);
      [...label.childNodes].forEach((node) => {
        if (node !== checkbox && node !== info) node.remove();
      });
      if (checkbox) checkbox.after(text);
      if (info) label.append(info);
    }
  });
  const taxYearSelect = document.querySelector('select[name="tax_year"]');
  const selectedTaxYear = taxYearSelect.value;
  const currentYear = new Date().getFullYear();
  taxYearSelect.replaceChildren();
  for (let year = 2024; year <= currentYear + 1; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = languageText([
      `Revenus ${year} · Déclaration ${year + 1}`,
      `${year} 年收入 · ${year + 1} 年申报`,
      `${year} income · ${year + 1} declaration`,
      `دخل ${year} · إقرار ${year + 1}`,
    ]);
    taxYearSelect.append(option);
  }
  taxYearSelect.value = [...taxYearSelect.options].some((option) => option.value === selectedTaxYear)
    ? selectedTaxYear
    : String(currentYear);
  const optionCopies = { "2025": ["Revenus 2025 · Déclaration 2026", "2025 年收入 · 2026 年申报", "2025 income · 2026 declaration", "دخل 2025 · إقرار 2026"], "2026": ["Revenus 2026 · Règles provisoires", "2026 年收入 · 暂行规则", "2026 income · provisional rules", "دخل 2026 · قواعد مؤقتة"], "2024": ["Revenus 2024", "2024 年收入", "2024 income", "دخل 2024"], auto: ["Automatique", "自动判断", "Automatic", "تلقائي"], micro: ["Micro-BIC", "Micro-BIC", "Micro-BIC", "Micro-BIC"], reel: ["Régime réel", "实际制度", "Real regime", "النظام الفعلي"], long_term: ["Location meublée de longue durée", "长租带家具出租", "Long-term furnished rental", "تأجير مفروش طويل الأجل"], tourism_classified: ["Meublé de tourisme classé", "已评级旅游家具房", "Classified tourist furnished rental", "إيجار سياحي مفروش مصنف"], tourism_unclassified: ["Meublé de tourisme non classé", "未评级旅游家具房", "Unclassified tourist furnished rental", "إيجار سياحي مفروش غير مصنف"], chambre_hotes: ["Chambre d'hôtes", "民宿客房", "Guest room", "غرفة ضيوف"], principal_home_room: ["Pièce de la résidence principale", "主住宅内房间", "Room in main home", "غرفة في المسكن الرئيسي"] };
  document.querySelectorAll("select option").forEach((option) => { if (optionCopies[option.value]) option.textContent = languageText(optionCopies[option.value]); });
  const placeholderCopies = {
    property_address: ["Adresse du logement loué", "出租房地址", "Rental property address", "عنوان العقار المؤجر"], real_taxable_result: ["Résultat issu de la liasse 2031", "来自 2031 税表的结果", "Result from the 2031 tax package", "النتيجة من ملف 2031"], charges: ["ex. 2500", "例如 2500", "e.g. 2500", "مثال: 2500"], loan_interest: ["ex. 4100", "例如 4100", "e.g. 4100", "مثال: 4100"], property_tax: ["ex. 950", "例如 950", "e.g. 950", "مثال: 950"], insurance: ["ex. 180", "例如 180", "e.g. 180", "مثال: 180"], condo_fees: ["ex. 1600", "例如 1600", "e.g. 1600", "مثال: 1600"], cfe: ["ex. 220", "例如 220", "e.g. 220", "مثال: 220"], land_value: ["ex. 30000", "例如 30000", "e.g. 30000", "مثال: 30000"]
  };
  document.querySelectorAll("input[name]").forEach((input) => { if (placeholderCopies[input.name]) input.placeholder = languageText(placeholderCopies[input.name]); });
  document.querySelector("#lmnp-page .field-note").textContent =
    currentLanguage === "fr"
      ? "Tous les champs ci-dessous sont des montants annuels en euros, pas des taux ni des mensualités."
      : currentLanguage === "en"
        ? "All fields below are annual amounts in euros, not rates or monthly amounts."
        : currentLanguage === "ar"
          ? "جميع الحقول التالية مبالغ سنوية باليورو وليست نسباً أو مبالغ شهرية."
          : "下面全部填全年欧元金额，不是百分比，也不是每月金额。";
  document.querySelectorAll("[data-help]").forEach((button) => { button.setAttribute("aria-label", currentLanguage === "fr" ? "Aide" : currentLanguage === "en" ? "Help" : currentLanguage === "ar" ? "مساعدة" : "帮助"); });
  document.querySelector(".topbar").classList.toggle("rtl", currentLanguage === "ar");
  renderLandlordGuide();
  renderLmnpOfficialLink();
  localStorage.setItem("auto-decla-language", currentLanguage);
  if (lastResult && !output.classList.contains("empty")) {
    renderResult(lastResult);
  } else if (output.classList.contains("empty")) {
    output.textContent = languageUiText("empty");
  }
  if (localServices.length) {
    refreshModuleLanguage();
  }
}

function setAppLanguage(value) {
  if (!supportedLanguages.has(value)) return;
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("lang", value);
  window.location.assign(nextUrl.toString());
}

window.setAppLanguage = setAppLanguage;
window.addEventListener("hashchange", route);

form.addEventListener("submit", evaluate);
if (searchButton) searchButton.addEventListener("click", searchCorpus);
helpClose.addEventListener("click", () => helpDialog.close());
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-help]");
  if (button) openHelp(button.dataset.help);
});

applyLanguage();
loadServices();
checkHealth();
