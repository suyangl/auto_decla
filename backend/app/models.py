from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class RentalKind(str, Enum):
    long_term = "long_term"
    tourism_classified = "tourism_classified"
    tourism_unclassified = "tourism_unclassified"
    chambre_hotes = "chambre_hotes"
    principal_home_room = "principal_home_room"


class RegimeChoice(str, Enum):
    auto = "auto"
    micro = "micro"
    reel = "reel"


class DeclarationInput(BaseModel):
    tax_year: int = Field(default_factory=lambda: date.today().year, ge=2024)

    @field_validator("tax_year")
    @classmethod
    def tax_year_must_be_current_or_next(cls, value: int) -> int:
        if value > date.today().year + 1:
            raise ValueError("tax_year cannot be more than one year ahead")
        return value
    fiscal_resident_france: bool = True
    furnished: bool = True
    rental_kind: RentalKind = RentalKind.long_term
    receipts: float = Field(default=0, ge=0)
    receipts_previous_year: float | None = Field(default=None, ge=0)
    receipts_two_years_prior: float | None = Field(default=None, ge=0)
    other_activity_income: float = Field(default=0, ge=0)
    in_principal_home: bool = False
    tenant_main_or_seasonal_residence: bool = False
    reasonable_rent: bool = False
    has_siret: bool = False
    first_year_activity: bool = False
    regime_choice: RegimeChoice = RegimeChoice.auto
    real_taxable_result: float | None = None
    charges: float = Field(default=0, ge=0)
    depreciation: float = Field(default=0, ge=0)
    prior_lmnp_deficit: float = Field(default=0, ge=0)
    property_address: str = ""
    declarant_label: str = "Declarant 1"
    acquisition_price: float = Field(default=0, ge=0)
    land_value: float = Field(default=0, ge=0)
    notary_fees: float = Field(default=0, ge=0)
    agency_fees: float = Field(default=0, ge=0)
    building_service_start: str = ""
    furniture_value: float = Field(default=0, ge=0)
    furniture_service_start: str = ""
    works_improvement: float = Field(default=0, ge=0)
    works_service_start: str = ""
    loan_interest: float = Field(default=0, ge=0)
    property_tax: float = Field(default=0, ge=0)
    insurance: float = Field(default=0, ge=0)
    condo_fees: float = Field(default=0, ge=0)
    repairs_maintenance: float = Field(default=0, ge=0)
    cfe: float = Field(default=0, ge=0)
    accounting_fees: float = Field(default=0, ge=0)
    other_deductible_charges: float = Field(default=0, ge=0)
    siren: str = ""
    siret: str = ""
    business_name: str = ""
    business_address: str = ""
    declarant_address: str = ""
    email: str = ""
    phone: str = ""
    activity_label: str = "Location meublée non professionnelle"
    exercise_opened_on: str = ""
    exercise_closed_on: str = ""
    computerized_accounting: bool = True
    accounting_software: str = ""
    tax_regime_simplified: bool = True
    vat_super_simplified: bool = False
    securities_income: float = Field(default=0, ge=0)
    short_term_capital_gain: float = Field(default=0, ge=0)
    long_term_capital_gain_128: float = Field(default=0, ge=0)
    exempt_income: float = Field(default=0, ge=0)
    general_expenses_gifts: float = Field(default=0, ge=0)
    general_expenses_receptions: float = Field(default=0, ge=0)
    personal_withdrawals: float = Field(default=0, ge=0)
    capital_contributions: float = Field(default=0, ge=0)


class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=5, ge=1, le=20)


class EvaluationResult(BaseModel):
    status: str
    classification: str
    regime: str
    taxable_basis: float
    copy_sheet: list[dict[str, Any]]
    steps: list[Any]
    warnings: list[Any]
    citations: list[dict[str, str]]
    form_2031: list[dict[str, Any]] = Field(default_factory=list)
    accounting_summary: list[dict[str, Any]] = Field(default_factory=list)
    debug: dict[str, Any] = Field(default_factory=dict)
