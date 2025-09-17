# Anti-Money Laundering (AML) and Know Your Customer (KYC) Framework
## TipTap Mobile Payment Application

**Document Version:** 1.0
**Effective Date:** September 16, 2025
**Next Review:** September 16, 2026
**Classification:** Confidential - Compliance Use Only

---

## Executive Summary

TipTap maintains a comprehensive Anti-Money Laundering (AML) and Know Your Customer (KYC) program to detect, prevent, and report suspicious activities while complying with federal regulations including the Bank Secrecy Act (BSA), USA PATRIOT Act, and FinCEN requirements.

**Program Highlights:**
- ✅ Risk-based customer due diligence program
- ✅ Real-time transaction monitoring and alerts
- ✅ Comprehensive sanctions screening (OFAC)
- ✅ Suspicious Activity Report (SAR) filing procedures
- ✅ Independent annual testing and validation

**Risk Level:** **LOW** (micro-transaction model with $20 limits reduces inherent ML/TF risks)

---

## 1. Regulatory Framework and Requirements

### 1.1 Federal Regulations

#### Bank Secrecy Act (BSA) Requirements:
- **Customer Identification Program (CIP):** 31 CFR 1022.210
- **Customer Due Diligence (CDD):** 31 CFR 1022.210
- **Beneficial Ownership:** 31 CFR 1010.230
- **Suspicious Activity Reporting:** 31 CFR 1022.320
- **Record Keeping:** 31 CFR 1022.410
- **Currency Transaction Reports (CTRs):** Not applicable (transactions <$10,000)

#### USA PATRIOT Act Sections:
- **Section 312:** Due diligence for correspondent accounts (not applicable)
- **Section 313:** Prohibition on shell banks (not applicable)
- **Section 314(a):** Information sharing with law enforcement
- **Section 314(b):** Voluntary information sharing
- **Section 326:** Customer identification programs

#### FinCEN Requirements:
- **MSB Registration:** Registered Money Services Business
- **Suspicious Activity Reports (SARs):** FinCEN Form 111
- **OFAC Sanctions Compliance:** Real-time screening requirements
- **Geographic Targeting Orders:** Monitor for special requirements

### 1.2 State Regulations
- **State MSB licenses:** AML compliance required in all licensed states
- **State-specific requirements:** Additional AML requirements in select states
- **Examination coordination:** Federal and state examination coordination

---

## 2. Risk Assessment Framework

### 2.1 Inherent Risk Analysis

#### Low Risk Factors:
- **Transaction Limits:** $20 maximum per transaction reduces ML risk
- **Service Type:** Digital tipping (legitimate, traceable purpose)
- **Customer Base:** Individual service workers (not high-risk entities)
- **Geographic Scope:** US-only operations (no high-risk jurisdictions)
- **Business Model:** Transparent, legitimate business purpose

#### Medium Risk Factors:
- **Digital Platform:** Potential for rapid, remote onboarding
- **Cash-Out Capability:** Ability to convert tips to cash
- **Volume Potential:** Individual users could make multiple transactions
- **Identity Verification:** Remote identity verification challenges

#### Risk Rating: **LOW-MEDIUM** Overall Risk Profile

### 2.2 Customer Risk Categories

#### Low Risk Customers:
- **Individual Users:** Personal use for receiving tips
- **Verified Identity:** Government ID and address verification completed
- **Normal Patterns:** Transaction patterns consistent with legitimate tipping
- **Geographic Location:** US-based customers in normal risk jurisdictions

#### Medium Risk Customers:
- **High Volume Users:** Receiving >$1,000 monthly in tips
- **Business Accounts:** Registered business entities (restaurants, salons)
- **Cash-Intensive Industries:** Businesses in cash-intensive sectors
- **New Customers:** First 90 days of account activity

#### High Risk Customers:
- **Suspicious Patterns:** Unusual transaction patterns or behavior
- **High-Risk Industries:** Adult entertainment, gambling-adjacent
- **PEP Status:** Politically Exposed Persons or family members
- **Previous SAR Filings:** Customers with prior suspicious activity

### 2.3 Product and Service Risk Assessment

#### TipTap Core Service Risk Analysis:
```
Risk Factor               | Risk Level | Mitigation
--------------------------|------------|------------------
Transaction Limits        | LOW        | $20 max hard limit
Geographic Scope          | LOW        | US-only operations
Customer Onboarding       | MEDIUM     | Enhanced ID verification
Payment Methods           | LOW        | Bank/card only (no cash/crypto)
Business Purpose          | LOW        | Legitimate tipping service
Anonymity                | LOW        | Full KYC required
Speed of Transactions     | MEDIUM     | Real-time processing
```

---

## 3. Customer Identification Program (CIP)

### 3.1 Customer Onboarding Requirements

#### Required Information for All Customers:
- **Full Legal Name** (as appears on government-issued ID)
- **Date of Birth** (age verification - must be 18+)
- **Physical Address** (verified through utility bill or bank statement)
- **Identification Number** (SSN, ITIN, or passport number)
- **Email Address** and **Mobile Phone Number**

#### Identity Verification Process:
1. **Document Collection:**
   - Government-issued photo ID (driver's license, passport, state ID)
   - Proof of address (utility bill, bank statement, lease agreement)
   - Selfie photo for biometric comparison

2. **Automated Verification (Jumio):**
   - ID document authenticity verification
   - Biometric facial recognition matching
   - Address verification through third-party databases
   - PEP and sanctions list screening

3. **Manual Review Process:**
   - Failed automated verifications reviewed by compliance team
   - Additional documentation requested as needed
   - Enhanced due diligence for high-risk customers
   - Final approval/denial decision with rationale

### 3.2 Enhanced Due Diligence (EDD)

#### Triggers for Enhanced Due Diligence:
- **High-Risk Customer Categories** (per risk assessment)
- **Unusual Application Information** (inconsistencies, red flags)
- **Geographic Risk** (customers from high-risk areas)
- **Business Accounts** (all business customers receive EDD)
- **PEP Status** (politically exposed persons and family)

#### EDD Procedures:
- **Additional Documentation:** Business licenses, beneficial ownership information
- **Source of Wealth Verification:** Documentation of legitimate income sources
- **Enhanced Monitoring:** Increased transaction monitoring and periodic reviews
- **Senior Management Approval:** Required for high-risk account approval
- **Ongoing Reviews:** Quarterly or annual reviews based on risk level

### 3.3 Beneficial Ownership Requirements

#### Applicability:
- **Legal Entity Customers:** All business accounts
- **Threshold:** Ownership of 25% or more
- **Control Persons:** Individuals with significant control

#### Information Required:
- **Beneficial Owners:** Name, DOB, address, SSN/ITIN
- **Control Persons:** Senior managing officials
- **Ownership Structure:** Corporate structure and ownership percentages
- **Verification:** Same identification requirements as individual customers

---

## 4. Customer Due Diligence (CDD) Program

### 4.1 Ongoing Customer Monitoring

#### Transaction Monitoring System:
- **Real-Time Screening:** All transactions screened against sanctions lists
- **Pattern Analysis:** Automated detection of unusual patterns
- **Threshold Monitoring:** Alerts for transactions approaching reporting thresholds
- **Cross-Reference Analysis:** Connections between customers and transactions

#### Monitoring Rules and Alerts:
```
Alert Type                    | Threshold        | Risk Level
------------------------------|------------------|------------
Daily Transaction Volume      | >$500           | Medium
Monthly Volume                | >$2,000         | Medium
Rapid Succession             | >5 in 1 hour    | High
Geographic Anomalies         | Out-of-state    | Low
Returned Transactions        | >3 per month    | High
Multiple Accounts            | Same person     | High
```

### 4.2 Periodic Review Program

#### Review Frequency by Risk Level:
- **Low Risk:** Annual reviews
- **Medium Risk:** Semi-annual reviews
- **High Risk:** Quarterly reviews
- **Very High Risk:** Monthly reviews

#### Review Components:
1. **Transaction Pattern Analysis:** Review of transaction history and patterns
2. **Profile Updates:** Verification of current customer information
3. **Risk Re-Assessment:** Updated risk rating based on activity
4. **Documentation Review:** Ensure all required documentation current
5. **Sanctions Screening:** Re-screening against updated watch lists

### 4.3 Customer Exit Procedures

#### Account Closure Triggers:
- **Suspicious Activity:** Unresolved suspicious activity concerns
- **Regulatory Requirements:** Required by law enforcement or regulators
- **Risk Management:** Customer exceeds acceptable risk tolerance
- **Non-Compliance:** Failure to provide required information or documentation
- **Business Decision:** Strategic business reasons

#### Closure Process:
1. **Final Transaction Processing:** Complete any pending transactions
2. **SAR Filing:** File SAR if suspicious activity involved in closure decision
3. **Fund Distribution:** Return funds to verified bank accounts
4. **Record Retention:** Maintain records per regulatory requirements (7 years)
5. **Reporting:** Report closure to relevant authorities if required

---

## 5. OFAC Sanctions Compliance

### 5.1 Sanctions List Screening

#### Screening Requirements:
- **Real-Time Screening:** All transactions screened before processing
- **Customer Onboarding:** All new customers screened during registration
- **Ongoing Screening:** Daily screening of existing customer base
- **List Updates:** Immediate screening against updated OFAC lists

#### Screening Coverage:
- **Specially Designated Nationals (SDN) List**
- **Sectoral Sanctions Identifications (SSI) List**
- **Foreign Sanctions Evaders (FSE) List**
- **Non-SDN Palestinian Legislative Council List**
- **Country-based sanctions programs**

### 5.2 Match Resolution Process

#### Match Categories:
- **Exact Match:** 100% match on name and identifying information
- **Close Match:** High probability match requiring investigation
- **Possible Match:** Lower probability match requiring review
- **False Positive:** Confirmed non-match after investigation

#### Resolution Procedures:
1. **Immediate Hold:** Transaction/account activity suspended pending review
2. **Information Gathering:** Collect additional identifying information
3. **Enhanced Review:** Senior compliance review of all available information
4. **Determination:** Final decision on match validity
5. **Action:** Block/report if true match, release if false positive
6. **Documentation:** Detailed records of analysis and decision rationale

### 5.3 Blocked Asset Procedures

#### Asset Freezing Requirements:
- **Immediate Action:** Assets frozen within minutes of confirmed match
- **OFAC Notification:** Report blocking to OFAC within 10 business days
- **Customer Notification:** Inform customer of blocking action (if permitted)
- **Record Keeping:** Detailed records of blocked transactions and assets

#### Blocking Report Requirements:
- **Annual Blocking Report:** Due by September 30 each year
- **Initial Blocking Report:** Within 10 business days of initial blocking
- **Continuation Reports:** Updates on blocked assets and transactions

---

## 6. Suspicious Activity Monitoring and Reporting

### 6.1 SAR Filing Requirements

#### Filing Thresholds:
- **Transaction Amount:** $2,000 or more (aggregate transactions)
- **Suspicious Activity:** Regardless of amount if criminal activity suspected
- **Filing Deadline:** Within 30 calendar days of initial detection
- **Law Enforcement:** Within 24 hours if ongoing criminal activity

#### SAR Filing Process:
1. **Alert Investigation:** Thorough investigation of monitoring system alerts
2. **Documentation:** Complete documentation of suspicious activity
3. **Decision Making:** Senior compliance officer review and filing decision
4. **Form Completion:** Complete FinCEN Form 111 with detailed narrative
5. **Electronic Filing:** Submit SAR through BSA E-Filing system
6. **Record Maintenance:** Maintain SAR and supporting documentation

### 6.2 Suspicious Activity Indicators

#### Transaction-Based Red Flags:
- **Structuring:** Multiple transactions just under reporting thresholds
- **Unusual Patterns:** Transactions inconsistent with customer profile
- **Geographic Anomalies:** Transactions from unusual locations
- **Timing Patterns:** Transactions at unusual times or rapid succession
- **Round Numbers:** Frequent use of round dollar amounts

#### Customer Behavior Red Flags:
- **Identity Concerns:** Suspicious or false identification documents
- **Evasive Behavior:** Reluctance to provide required information
- **Inconsistent Information:** Contradictory information provided
- **Knowledge Gaps:** Lack of knowledge about legitimate business
- **Multiple Accounts:** Attempts to open multiple accounts

#### Technology-Based Red Flags:
- **IP Address Anomalies:** VPN usage, suspicious geographic locations
- **Device Patterns:** Multiple accounts from same device
- **Velocity:** Rapid account creation or transaction patterns
- **Authentication Issues:** Multiple failed authentication attempts

### 6.3 SAR Quality and Completeness

#### Narrative Requirements:
- **Five W's:** Who, What, When, Where, Why of suspicious activity
- **Detailed Description:** Comprehensive description of suspicious activity
- **Supporting Facts:** All relevant facts and circumstances
- **Investigation Steps:** Actions taken to investigate the activity
- **Conclusion:** Why the activity is considered suspicious

#### Supporting Documentation:
- Transaction records and account statements
- Customer identification and verification documents
- Communication records (emails, chat logs, phone records)
- Third-party information (news articles, public records)
- Internal investigation notes and analysis

---

## 7. Training and Awareness Program

### 7.1 Training Requirements

#### All Employees:
- **Initial Training:** AML awareness training within 30 days of hire
- **Annual Training:** Comprehensive AML training annually
- **Update Training:** Training on regulatory changes and new requirements
- **Testing:** Annual testing on AML knowledge and procedures

#### Specialized Training by Role:
```
Role                    | Training Frequency | Specialized Content
------------------------|-------------------|--------------------
Compliance Officers     | Quarterly         | Advanced AML/BSA law
Customer Service        | Semi-annually     | Red flag recognition
IT/Security            | Annually          | Transaction monitoring
Management             | Annually          | Regulatory oversight
New Employees          | Within 30 days    | Company-specific procedures
```

### 7.2 Training Content

#### Core Curriculum:
- **Regulatory Overview:** BSA, USA PATRIOT Act, FinCEN requirements
- **Risk Assessment:** Understanding and identifying money laundering risks
- **CIP Requirements:** Customer identification and verification procedures
- **Transaction Monitoring:** Red flag recognition and alert investigation
- **SAR Filing:** When and how to file suspicious activity reports
- **OFAC Compliance:** Sanctions screening and blocking procedures
- **Record Keeping:** Documentation and retention requirements

#### Role-Specific Training:
- **Customer Service:** Identity verification, suspicious behavior recognition
- **Compliance Team:** Advanced investigation techniques, regulatory updates
- **Management:** Program oversight, regulatory examination preparation
- **IT Team:** System controls, data security, monitoring system management

### 7.3 Training Effectiveness

#### Measurement Methods:
- **Training Tests:** Minimum 80% passing score required
- **Scenario Exercises:** Practical application of AML procedures
- **Performance Metrics:** SAR quality, investigation timeliness
- **Examination Feedback:** Regulatory examination findings
- **Employee Feedback:** Training evaluation surveys and suggestions

---

## 8. Independent Testing and Audit

### 8.1 Independent Testing Program

#### Testing Scope:
- **AML Program Effectiveness:** Overall program assessment
- **Policies and Procedures:** Review of written procedures and implementation
- **Training Program:** Evaluation of training effectiveness
- **Systems and Controls:** Testing of monitoring systems and controls
- **Record Keeping:** Review of documentation and record maintenance

#### Testing Frequency:
- **Annual Testing:** Comprehensive program testing annually
- **Risk-Based Testing:** Additional testing based on risk assessment
- **Post-Incident Testing:** Testing following significant AML events
- **Regulatory Testing:** Testing in preparation for examinations

### 8.2 Internal Audit Function

#### Audit Responsibilities:
- **Program Assessment:** Annual assessment of AML program effectiveness
- **Control Testing:** Testing of key AML controls and procedures
- **Issue Identification:** Identification of weaknesses and gaps
- **Recommendation Development:** Recommendations for program improvements
- **Follow-up Testing:** Validation of corrective action implementation

#### Audit Reporting:
- **Management Reports:** Regular reports to senior management
- **Board Reporting:** Annual report to board of directors
- **Regulatory Reports:** Reports to regulators as required
- **Issue Tracking:** Tracking of audit findings and corrective actions

### 8.3 External Validation

#### Independent Testing Provider:
- **Qualified Firm:** Engaged AML consulting firm with relevant expertise
- **Annual Engagement:** Comprehensive annual testing engagement
- **Specialized Testing:** Additional testing for complex issues or regulatory changes
- **Regulatory Coordination:** Coordination with regulatory examination schedules

#### Testing Deliverables:
- **Comprehensive Report:** Detailed findings and recommendations
- **Management Letter:** Summary for senior management and board
- **Action Plan:** Specific recommendations with implementation timelines
- **Follow-up Review:** Validation of corrective action effectiveness

---

## 9. Record Keeping and Documentation

### 9.1 Record Retention Requirements

#### BSA Record Retention (5 Years):
- **CIP Records:** Customer identification and verification documents
- **Transaction Records:** Records of transactions >$3,000
- **Suspicious Activity:** SAR supporting documentation
- **Training Records:** Employee training records and certifications

#### Extended Retention (7 Years):
- **Account Records:** Account opening documents and updates
- **Correspondence:** Customer communication records
- **Investigation Files:** SAR investigations and supporting documentation
- **Audit Records:** Independent testing and audit reports

### 9.2 Documentation Standards

#### File Organization:
- **Customer Files:** Comprehensive customer record files
- **SAR Files:** Suspicious activity report files with supporting documentation
- **Training Files:** Employee training records and certifications
- **Audit Files:** Testing and audit documentation

#### Document Security:
- **Physical Security:** Locked file cabinets and restricted access
- **Electronic Security:** Encrypted storage with access controls
- **Backup Systems:** Regular backups with offsite storage
- **Disposal Procedures:** Secure destruction at end of retention period

### 9.3 Privacy and Confidentiality

#### SAR Confidentiality:
- **Filing Confidentiality:** SARs and supporting documentation kept confidential
- **Access Restrictions:** Limited access to authorized personnel only
- **Tipping Prohibition:** Prohibition on notifying subjects of SAR filings
- **Legal Protection:** Legal protections for good faith SAR filings

---

## 10. Program Management and Oversight

### 10.1 AML Compliance Officer

#### Designated AML Officer:
- **Name:** [Chief Compliance Officer]
- **Qualifications:** CAMS certification, 10+ years AML experience
- **Responsibilities:** Overall AML program management and oversight
- **Authority:** Direct access to senior management and board of directors
- **Resources:** Adequate staffing and systems resources

#### AML Officer Duties:
- **Program Development:** Develop and maintain AML policies and procedures
- **Risk Assessment:** Conduct and update AML risk assessments
- **Training Oversight:** Develop and oversee training programs
- **Regulatory Relations:** Liaison with regulators and law enforcement
- **Investigation Management:** Oversee suspicious activity investigations

### 10.2 Senior Management Oversight

#### Management Responsibilities:
- **Program Approval:** Approve AML program and significant changes
- **Resource Allocation:** Ensure adequate resources for AML compliance
- **Performance Monitoring:** Monitor AML program effectiveness
- **Regulatory Compliance:** Ensure full compliance with AML requirements
- **Risk Management:** Oversee AML risk management activities

#### Board of Directors Oversight:
- **Program Oversight:** Quarterly reports on AML program performance
- **Risk Assessment Review:** Annual review of AML risk assessment
- **Independent Testing:** Review of independent testing results
- **Regulatory Relations:** Updates on regulatory examinations and enforcement

### 10.3 Regulatory Examination Readiness

#### Examination Preparation:
- **Document Organization:** Maintain examination-ready documentation
- **Staff Training:** Ensure staff prepared for examination interviews
- **System Access:** Provide examiners with necessary system access
- **Response Coordination:** Coordinate responses to examination requests

#### Common Examination Areas:
- **Risk Assessment:** Review of AML risk assessment methodology and results
- **Policies and Procedures:** Review of written AML policies and procedures
- **Training Program:** Evaluation of employee training programs
- **Transaction Monitoring:** Testing of monitoring systems and alert investigation
- **SAR Filing:** Review of SAR filing decisions and quality

---

## 11. Technology Systems and Controls

### 11.1 AML Technology Stack

#### Core Systems:
- **Customer Onboarding:** Jumio identity verification platform
- **Transaction Monitoring:** Custom rules-based monitoring system
- **OFAC Screening:** Real-time sanctions list screening
- **Case Management:** Comprehensive case management for investigations
- **Reporting Systems:** Automated SAR preparation and filing

#### System Architecture:
```
Customer Data → Identity Verification → OFAC Screening
     ↓                    ↓                  ↓
Transaction Processing → Monitoring Engine → Alert Generation
     ↓                    ↓                  ↓
Case Management → Investigation → SAR Filing (if required)
```

### 11.2 System Controls and Security

#### Access Controls:
- **Role-Based Access:** Access based on job responsibilities
- **Multi-Factor Authentication:** Required for all AML system access
- **Audit Logging:** Comprehensive logging of all system access and activities
- **Regular Access Reviews:** Quarterly review of user access rights

#### Data Security:
- **Encryption:** AES-256 encryption for all sensitive AML data
- **Network Security:** VPN required for remote access to AML systems
- **Data Backup:** Regular backups with secure offsite storage
- **Incident Response:** Security incident response procedures

### 11.3 System Performance and Monitoring

#### Performance Metrics:
- **Alert Processing:** Time from alert generation to resolution
- **False Positive Rate:** Percentage of alerts that are false positives
- **System Uptime:** Availability of AML monitoring systems
- **Data Quality:** Accuracy and completeness of AML data

#### Continuous Improvement:
- **System Tuning:** Regular tuning of monitoring rules and thresholds
- **Technology Updates:** Regular updates and system enhancements
- **User Feedback:** Incorporation of user feedback into system improvements
- **Regulatory Updates:** Updates to address new regulatory requirements

---

## 12. Incident Response and Corrective Action

### 12.1 AML Incident Response

#### Incident Categories:
- **Regulatory Violations:** Violations of AML laws or regulations
- **System Failures:** AML system outages or malfunctions
- **Process Breakdowns:** Failures in AML processes or procedures
- **External Threats:** Suspected money laundering or terrorist financing

#### Response Procedures:
1. **Incident Identification:** Immediate identification and assessment
2. **Containment:** Steps to prevent further impact or damage
3. **Investigation:** Thorough investigation of incident causes
4. **Corrective Action:** Implementation of corrective measures
5. **Documentation:** Complete documentation of incident and response
6. **Reporting:** Reports to management, regulators as required

### 12.2 Regulatory Enforcement Response

#### Enforcement Action Types:
- **Examination Findings:** Regulatory examination findings and citations
- **Consent Orders:** Formal agreements with regulators
- **Civil Penalties:** Monetary penalties for AML violations
- **Corrective Actions:** Required improvements to AML program

#### Response Strategy:
- **Legal Counsel:** Immediate engagement of qualified AML counsel
- **Regulatory Cooperation:** Full cooperation with regulatory investigations
- **Remedial Actions:** Prompt implementation of required improvements
- **Stakeholder Communication:** Appropriate communication with stakeholders

---

## Conclusion

TipTap's AML/KYC framework provides comprehensive protection against money laundering and terrorist financing while maintaining a positive customer experience. The program's risk-based approach, combined with robust technology systems and qualified personnel, ensures effective compliance with all applicable AML regulations.

**Key Program Strengths:**
- Risk-based customer due diligence procedures
- Real-time transaction monitoring and OFAC screening
- Comprehensive training and awareness program
- Independent testing and continuous improvement
- Strong regulatory relationship management

**Continuous Improvement Commitment:**
TipTap is committed to continuously improving its AML program through regular assessment, technology enhancement, staff development, and incorporation of regulatory guidance and industry best practices.

---

**Document Control:**
- **Created:** September 16, 2025
- **Owner:** Chief Compliance Officer
- **Approved By:** [CEO Name], [Board Chair Name]
- **Distribution:** Senior Management, Compliance Team, External Auditors
- **Classification:** Confidential - Compliance Use Only
- **Next Review:** September 16, 2026

**Related Documents:**
- BSA/AML Policies and Procedures Manual
- Customer Due Diligence Procedures
- Suspicious Activity Reporting Procedures
- OFAC Sanctions Compliance Manual
- AML Training Program Materials