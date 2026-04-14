from datetime import date, datetime
from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text,
    Table,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


role_competencies = Table(
    "role_competencies",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("competency_id", Integer, ForeignKey("competencies.id", ondelete="CASCADE"), primary_key=True),
)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    portal_role = Column(String(50), nullable=False, default="Employee")
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="user_account")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True, default="")
    last_name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=True, default="")
    birthdate = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True, default="")
    marital_status = Column(String(30), nullable=True, default="")
    home_address = Column(Text, nullable=True, default="")
    permanent_address = Column(Text, nullable=True, default="")
    team = Column(String(100), nullable=True, default="")
    regularization_date = Column(Date, nullable=True)
    department = Column(String(100), nullable=True, default="")
    job_title = Column(String(150), nullable=True, default="")
    job_description = Column(Text, nullable=True, default="")
    teamflect_role = Column(String(50), nullable=True, default="Employee")
    date_hired = Column(Date, nullable=True)
    status = Column(String(30), nullable=True, default="Active")
    supervisor = Column(String(200), nullable=True, default="")
    reviewers = Column(Text, nullable=True, default="")
    sss_number = Column(String(50), nullable=True, default="")
    hdmf_number = Column(String(50), nullable=True, default="")
    phil_health_number = Column(String(50), nullable=True, default="")
    tin = Column(String(50), nullable=True, default="")
    email = Column(String(200), nullable=True, default="")
    phone = Column(String(50), nullable=True, default="")
    country = Column(String(100), nullable=True, default="")
    office_location = Column(String(200), nullable=True, default="")
    profile_photo = Column(Text, nullable=True, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True, default="")
    created_by = Column(String(200), nullable=True, default="")
    status = Column(String(20), nullable=False, default="Active")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = relationship("Role", back_populates="department_rel")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_job_title = Column(String(200), nullable=False)
    role_description = Column(Text, nullable=True, default="")
    users_in_role = Column(Integer, nullable=True, default=0)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(String(200), nullable=True, default="")
    status = Column(String(20), nullable=False, default="Active")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department_rel = relationship("Department", back_populates="roles")
    competencies = relationship("Competency", secondary=role_competencies, back_populates="roles")


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    competency_code = Column(String(30), unique=True, nullable=False)
    competency_name = Column(String(200), nullable=False)
    competency_description = Column(Text, nullable=True, default="")
    expectations = Column(Text, nullable=True, default="")
    competency_level = Column(String(60), nullable=True, default="")
    competency_experts = Column(String(300), nullable=True, default="")
    created_by = Column(String(200), nullable=True, default="")
    status = Column(String(20), nullable=False, default="Active")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    learning_materials = relationship("CompetencyLearningMaterial", back_populates="competency", cascade="all, delete-orphan")
    roles = relationship("Role", secondary=role_competencies, back_populates="competencies")


class CompetencyLearningMaterial(Base):
    __tablename__ = "competency_learning_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    competency_id = Column(Integer, ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False)
    material_type = Column(String(50), nullable=True, default="Link")
    url = Column(Text, nullable=True, default="")
    name = Column(String(300), nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    category = Column(String(100), nullable=True, default="")
    duration = Column(String(50), nullable=True, default="")

    competency = relationship("Competency", back_populates="learning_materials")


class ReviewTemplate(Base):
    __tablename__ = "review_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("ReviewTemplateSection", back_populates="template", cascade="all, delete-orphan", order_by="ReviewTemplateSection.sort_order")


class ReviewTemplateSection(Base):
    __tablename__ = "review_template_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("review_templates.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(300), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    source_question_set_id = Column(Integer, nullable=True)

    template = relationship("ReviewTemplate", back_populates="sections")
    questions = relationship("ReviewTemplateQuestion", back_populates="section", cascade="all, delete-orphan", order_by="ReviewTemplateQuestion.sort_order")


class ReviewTemplateQuestion(Base):
    __tablename__ = "review_template_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("review_template_sections.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="Long Answer")
    options = Column(Text, nullable=True, default="")
    required = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    section = relationship("ReviewTemplateSection", back_populates="questions")


class ReviewQuestionSet(Base):
    __tablename__ = "review_question_sets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("ReviewQuestionSetSection", back_populates="question_set", cascade="all, delete-orphan", order_by="ReviewQuestionSetSection.sort_order")


class ReviewQuestionSetSection(Base):
    __tablename__ = "review_question_set_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_set_id = Column(Integer, ForeignKey("review_question_sets.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(300), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    question_set = relationship("ReviewQuestionSet", back_populates="sections")
    questions = relationship("ReviewQuestionSetQuestion", back_populates="section", cascade="all, delete-orphan", order_by="ReviewQuestionSetQuestion.sort_order")


class ReviewQuestionSetQuestion(Base):
    __tablename__ = "review_question_set_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("review_question_set_sections.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="Long Answer")
    options = Column(Text, nullable=True, default="")
    required = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    section = relationship("ReviewQuestionSetSection", back_populates="questions")


class SurveyTemplate(Base):
    __tablename__ = "survey_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("SurveyTemplateSection", back_populates="template", cascade="all, delete-orphan", order_by="SurveyTemplateSection.sort_order")


class SurveyTemplateSection(Base):
    __tablename__ = "survey_template_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("survey_templates.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(300), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    source_question_set_id = Column(Integer, nullable=True)

    template = relationship("SurveyTemplate", back_populates="sections")
    questions = relationship("SurveyTemplateQuestion", back_populates="section", cascade="all, delete-orphan", order_by="SurveyTemplateQuestion.sort_order")


class SurveyTemplateQuestion(Base):
    __tablename__ = "survey_template_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("survey_template_sections.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="Long Answer")
    options = Column(Text, nullable=True, default="")
    required = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    section = relationship("SurveyTemplateSection", back_populates="questions")


class SurveyQuestionSet(Base):
    __tablename__ = "survey_question_sets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("SurveyQuestionSetSection", back_populates="question_set", cascade="all, delete-orphan", order_by="SurveyQuestionSetSection.sort_order")


class SurveyQuestionSetSection(Base):
    __tablename__ = "survey_question_set_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_set_id = Column(Integer, ForeignKey("survey_question_sets.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(300), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    question_set = relationship("SurveyQuestionSet", back_populates="sections")
    questions = relationship("SurveyQuestionSetQuestion", back_populates="section", cascade="all, delete-orphan", order_by="SurveyQuestionSetQuestion.sort_order")


class SurveyQuestionSetQuestion(Base):
    __tablename__ = "survey_question_set_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("survey_question_set_sections.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="Long Answer")
    options = Column(Text, nullable=True, default="")
    required = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    section = relationship("SurveyQuestionSetSection", back_populates="questions")


class RecognitionBadge(Base):
    __tablename__ = "recognition_badges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image = Column(Text, nullable=True, default="")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True, default="")
    is_official = Column(Boolean, nullable=False, default=False)
    point = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(200), nullable=False, default="")
    updated_by = Column(String(200), nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    reward_name = Column(String(200), nullable=False)
    reward_description = Column(Text, nullable=True, default="")
    redeem_points = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(200), nullable=False, default="")
    updated_by = Column(String(200), nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmployeeAttachment(Base):
    __tablename__ = "employee_attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=True, default=0)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="attachments")


class CompanyResource(Base):
    __tablename__ = "company_resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    category = Column(String(50), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=True, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    uploaded_by = Column(String(200), nullable=False, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RewardRedeem(Base):
    __tablename__ = "reward_redeems"

    id = Column(Integer, primary_key=True, autoincrement=True)
    requested_by = Column(String(200), nullable=False)
    user_mail = Column(String(200), nullable=True, default="")
    reward_name = Column(String(200), nullable=False)
    reward_points = Column(Integer, nullable=False, default=0)
    redeem_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="Pending")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RecognitionGiven(Base):
    __tablename__ = "recognition_given"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_email = Column(String(200), nullable=False)
    to_email = Column(String(200), nullable=False)
    badge_id = Column(Integer, ForeignKey("recognition_badges.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=True, default="")
    points = Column(Integer, nullable=False, default=0)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    badge = relationship("RecognitionBadge")


class ReviewCycle(Base):
    __tablename__ = "review_cycles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("review_templates.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(300), nullable=False)
    reviewee_email = Column(String(200), nullable=False)
    reviewer_email = Column(String(200), nullable=False, default="")
    due_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="Pending")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("ReviewTemplate")
    responses = relationship("ReviewResponse", back_populates="cycle", cascade="all, delete-orphan")


class ReviewResponse(Base):
    __tablename__ = "review_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cycle_id = Column(Integer, ForeignKey("review_cycles.id", ondelete="CASCADE"), nullable=False)
    respondent_email = Column(String(200), nullable=False)
    status = Column(String(30), nullable=False, default="Draft")
    submitted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cycle = relationship("ReviewCycle", back_populates="responses")
    answers = relationship("ReviewResponseAnswer", back_populates="response", cascade="all, delete-orphan")


class ReviewResponseAnswer(Base):
    __tablename__ = "review_response_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("review_responses.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    section_id = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=True, default="")
    rating = Column(Integer, nullable=True)
    selected_options = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    response = relationship("ReviewResponse", back_populates="answers")


class SurveyCampaign(Base):
    __tablename__ = "survey_campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("survey_templates.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(300), nullable=False)
    scope = Column(String(50), nullable=False, default="All Employees")
    due_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="Active")
    created_by_email = Column(String(200), nullable=False, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("SurveyTemplate")
    responses = relationship("SurveyResponse", back_populates="campaign", cascade="all, delete-orphan")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey("survey_campaigns.id", ondelete="CASCADE"), nullable=False)
    respondent_email = Column(String(200), nullable=False)
    status = Column(String(30), nullable=False, default="Draft")
    submitted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campaign = relationship("SurveyCampaign", back_populates="responses")
    answers = relationship("SurveyResponseAnswer", back_populates="response", cascade="all, delete-orphan")


class SurveyResponseAnswer(Base):
    __tablename__ = "survey_response_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("survey_responses.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    section_id = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=True, default="")
    rating = Column(Integer, nullable=True)
    selected_options = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    response = relationship("SurveyResponse", back_populates="answers")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_user_id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    from_user = relationship("UserAccount", foreign_keys=[from_user_id])
    to_user = relationship("UserAccount", foreign_keys=[to_user_id])


class OnboardingStep(Base):
    __tablename__ = "onboarding_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("OnboardingDocument", back_populates="step", order_by="OnboardingDocument.sort_order")


class OnboardingDocument(Base):
    __tablename__ = "onboarding_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    step_id = Column(Integer, ForeignKey("onboarding_steps.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    reference_url = Column(String(1000), nullable=True, default=None)
    sort_order = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    step = relationship("OnboardingStep", back_populates="documents")
    uploads = relationship("OnboardingUpload", back_populates="document")


class OnboardingUpload(Base):
    __tablename__ = "onboarding_uploads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("onboarding_documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("OnboardingDocument", back_populates="uploads")
    user = relationship("UserAccount")
