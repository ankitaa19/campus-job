# CampusPe Job Source Inventory

Generated from the source catalogs used by the CampusPe API. Last regenerated: 2026-08-06.

> Important: “catalogued” does not mean “currently fetching.” CampusPe fetches only from active public feeds, configured ATS tenants, verified structured career pages, direct CampusPe employer postings, or sources with the required permission/licence. Portal and government entries remain inactive until a lawful supported connector is configured.

## Status legend

| Status | Meaning |
| --- | --- |
| Active by default | Used when starter sources are enabled and no replacement provider configuration is supplied. |
| Configurable | Connector exists, but the deployed environment must provide company slugs or URLs. |
| Discovery catalog | Stored inactive first; activated only after public structured job data and robots/host checks are verified. |
| Permission required | Not fetched unless an official API/licence, written permission, or explicit public terms allow automation. |
| Direct CampusPe | Created by employers in CampusPe rather than imported from another website. |

## Sources CampusPe can actively fetch

| Source | Website/API | Connector | Default status |
| --- | --- | --- | --- |
| Omnisend | [Lever postings API](https://api.lever.co/v0/postings/omnisend) | Lever | Active by default |
| Stripe | [Greenhouse job board](https://boards.greenhouse.io/stripe) | Greenhouse | Active by default |
| Figma | [Greenhouse job board](https://boards.greenhouse.io/figma) | Greenhouse | Active by default |
| Discord | [Greenhouse job board](https://boards.greenhouse.io/discord) | Greenhouse | Active by default |
| Ramp | [Ashby job board](https://jobs.ashbyhq.com/ramp) | Ashby | Active by default |
| Notion | [Ashby job board](https://jobs.ashbyhq.com/notion) | Ashby | Active by default |
| Himalayas | [Public jobs API](https://himalayas.app/jobs/api) | Public JSON feed | Active by default |
| We Work Remotely | [Remote jobs RSS](https://weworkremotely.com/remote-jobs.rss) | Public RSS feed | Active by default |
| Other Lever companies | [Lever](https://www.lever.co/) | Lever company slug | Configurable |
| Other Greenhouse companies | [Greenhouse](https://www.greenhouse.com/) | Greenhouse board slug | Configurable |
| Other Ashby companies | [Ashby](https://www.ashbyhq.com/) | Ashby board slug | Configurable |
| Other SmartRecruiters companies | [SmartRecruiters](https://www.smartrecruiters.com/) | SmartRecruiters company slug | Configurable |
| Workday career sites | [Workday](https://www.workday.com/) | Public myworkdayjobs CXS endpoint | Configurable |
| Structured company career pages | Company-specific HTTPS career URL | Schema.org JobPosting / discovered ATS | Configurable and verified only |
| Authorized JavaScript job pages | Source-specific HTTPS jobs URL | Permission-gated Selenium JSON-LD | Configurable and permission required |
| CampusPe employer jobs | CampusPe recruiter portal | Direct database posting | Direct CampusPe |

Environment variables may replace the default companies: `LEVER_COMPANIES`, `GREENHOUSE_COMPANIES`, `ASHBY_COMPANIES`, `SMARTRECRUITERS_COMPANIES`, `WORKDAY_COMPANIES`, `CAREER_PAGE_COMPANIES`, and permission-gated `SELENIUM_JOB_SOURCES`.

## Job portals (44)

Status for every entry in this section: **Permission required / inactive catalog entry**.

| # | Name and URL | Slug | Ingestion policy |
| --- | --- | --- | --- |
| 1 | [Naukri.com](https://www.naukri.com) | naukri-com | licensed_connector_required |
| 2 | [LinkedIn Jobs](https://www.linkedin.com/jobs) | linkedin-jobs | licensed_connector_required |
| 3 | [Indeed India](https://in.indeed.com) | indeed-india | licensed_connector_required |
| 4 | [Foundit (ex-Monster India)](https://www.foundit.in) | foundit | licensed_connector_required |
| 5 | [Glassdoor India](https://www.glassdoor.co.in) | glassdoor-india | licensed_connector_required |
| 6 | [Shine.com](https://www.shine.com) | shine-com | licensed_connector_required |
| 7 | [TimesJobs](https://www.timesjobs.com) | timesjobs | licensed_connector_required |
| 8 | [Apna.co](https://apna.co) | apna-co | licensed_connector_required |
| 9 | [WorkIndia](https://www.workindia.in) | workindia | licensed_connector_required |
| 10 | [Internshala](https://internshala.com) | internshala | licensed_connector_required |
| 11 | [Hirist](https://www.hirist.com) | hirist | licensed_connector_required |
| 12 | [Wellfound (AngelList)](https://wellfound.com) | wellfound | licensed_connector_required |
| 13 | [Upwork](https://www.upwork.com) | upwork | licensed_connector_required |
| 14 | [Fiverr](https://www.fiverr.com) | fiverr | licensed_connector_required |
| 15 | [IIM Jobs](https://www.iimjobs.com) | iim-jobs | licensed_connector_required |
| 16 | [Cutshort](https://cutshort.io) | cutshort | licensed_connector_required |
| 17 | [Freshersworld](https://www.freshersworld.com) | freshersworld | licensed_connector_required |
| 18 | [National Career Service (Govt)](https://www.ncs.gov.in) | national-career-service | licensed_connector_required |
| 19 | [Sarkari Result](https://www.sarkariresult.com) | sarkari-result | licensed_connector_required |
| 20 | [FreeJobAlert](https://www.freejobalert.com) | freejobalert | licensed_connector_required |
| 21 | [Monster India](https://www.monsterindia.com) | monster-india | licensed_connector_required |
| 22 | [Jobsforher](https://www.jobsforher.com) | jobsforher | licensed_connector_required |
| 23 | [Instahyre](https://www.instahyre.com) | instahyre | licensed_connector_required |
| 24 | [AngelList Talent](https://angel.co/jobs) | angellist-talent | licensed_connector_required |
| 25 | [Naukrigulf](https://www.naukrigulf.com) | naukrigulf | licensed_connector_required |
| 26 | [Quikr Jobs](https://www.quikr.com/jobs) | quikr-jobs | licensed_connector_required |
| 27 | [Babajob (now part of Quikr)](https://www.babajob.com) | babajob | licensed_connector_required |
| 28 | [Rozgar India](https://www.rozgar.com) | rozgar-india | licensed_connector_required |
| 29 | [Talentanywhere.ai](https://talentanywhere.ai) | talentanywhere-ai | licensed_connector_required |
| 30 | [Hirect](https://hirect.in) | hirect | licensed_connector_required |
| 31 | [CareerBuilder India](https://www.careerbuilder.co.in) | careerbuilder-india | licensed_connector_required |
| 32 | [Jobstreet (SEA/India roles)](https://www.jobstreet.com) | jobstreet | licensed_connector_required |
| 33 | [Vahan](https://vahan.co) | vahan | licensed_connector_required |
| 34 | [BetterPlace](https://betterplace.co.in) | betterplace | licensed_connector_required |
| 35 | [Skillbee](https://www.skillbee.com) | skillbee | licensed_connector_required |
| 36 | [Aasaanjobs (now part of Awign)](https://www.awign.com) | aasaanjobs | licensed_connector_required |
| 37 | [Firstnaukri](https://www.firstnaukri.com) | firstnaukri | licensed_connector_required |
| 38 | [Jobsora India](https://in.jobsora.com) | jobsora-india | licensed_connector_required |
| 39 | [CareerAge](https://www.careerage.com) | careerage | licensed_connector_required |
| 40 | [Techgig](https://www.techgig.com) | techgig | licensed_connector_required |
| 41 | [Placement India](https://www.placementindia.com) | placement-india | licensed_connector_required |
| 42 | [Sulekha Jobs](https://jobs.sulekha.com) | sulekha-jobs | licensed_connector_required |
| 43 | [ClickIndia Jobs](https://jobs.clickindia.com) | clickindia-jobs | licensed_connector_required |
| 44 | [HiringCafe](https://hiringcafe.com/) | hiring-cafe | licensed_connector_required |

## Government recruitment sources (62)

Status for every entry in this section: **Catalogued only** until a dedicated official structured-feed adapter is verified.

| # | Name and URL | Slug |
| --- | --- | --- |
| 1 | [National Career Service (Ministry of Labour)](https://www.ncs.gov.in) | national-career-service-2 |
| 2 | [UPSC (Union Public Service Commission)](https://upsc.gov.in) | upsc |
| 3 | [SSC (Staff Selection Commission)](https://ssc.nic.in) | ssc |
| 4 | [IBPS (Banking recruitment)](https://www.ibps.in) | ibps |
| 5 | [RRB (Railway Recruitment Boards)](https://www.rrbcdg.gov.in) | rrb |
| 6 | [Indian Railways Careers](https://indianrailways.gov.in) | indian-railways-careers |
| 7 | [DRDO Careers](https://www.drdo.gov.in/careers) | drdo-careers |
| 8 | [ISRO Careers](https://www.isro.gov.in/Careers.html) | isro-careers |
| 9 | [Defence Civilian Jobs (MoD)](https://www.mod.gov.in) | defence-civilian-jobs |
| 10 | [Indian Army Careers](https://joinindianarmy.nic.in) | indian-army-careers |
| 11 | [Indian Navy Careers](https://www.joinindiannavy.gov.in) | indian-navy-careers |
| 12 | [Indian Air Force Careers](https://afcat.cdac.in) | indian-air-force-careers |
| 13 | [AIIMS Recruitment](https://www.aiims.edu/en/recruitment.html) | aiims-recruitment |
| 14 | [Reserve Bank of India Careers](https://opportunities.rbi.org.in) | reserve-bank-of-india-careers |
| 15 | [SEBI Careers](https://www.sebi.gov.in/sebiweb/careers/careers.jsp) | sebi-careers |
| 16 | [LIC Careers](https://licindia.in/careers) | lic-careers |
| 17 | [EPFO Recruitment](https://www.epfindia.gov.in) | epfo-recruitment |
| 18 | [Employment News (Govt weekly gazette)](https://employmentnews.gov.in) | employment-news |
| 19 | [Central Board of Direct Taxes (Income Tax Dept.)](https://www.incometaxindia.gov.in/pages/careers.aspx) | central-board-of-direct-taxes |
| 20 | [Postal Department (India Post) Recruitment](https://www.indiapost.gov.in/VAS/Pages/Recruitment.aspx) | postal-department-recruitment |
| 21 | [Bharat Electronics (BEL) Careers](https://bel-india.in/careers) | bharat-electronics-careers |
| 22 | [Airports Authority of India Careers](https://www.aai.aero/en/careers) | airports-authority-of-india-careers |
| 23 | [Food Corporation of India Careers](https://fci.gov.in/careers) | food-corporation-of-india-careers |
| 24 | [ONGC Careers](https://www.ongcindia.com/web/eng/careers) | ongc-careers |
| 25 | [NTPC Careers](https://www.ntpc.co.in/careers) | ntpc-careers |
| 26 | [Coal India Careers](https://www.coalindia.in/career.aspx) | coal-india-careers |
| 27 | [BSNL Careers](https://www.bsnl.co.in/careers) | bsnl-careers |
| 28 | [Steel Authority of India Careers](https://sail.co.in/en/careers) | steel-authority-of-india-careers |
| 29 | [Central Universities Recruitment (UGC)](https://www.ugc.gov.in) | central-universities-recruitment |
| 30 | [NIC (National Informatics Centre) Careers](https://www.nic.in/recruitment) | nic-careers |
| 31 | [Andhra Pradesh PSC](https://psc.ap.gov.in) | andhra-pradesh-psc |
| 32 | [Arunachal Pradesh PSC](https://apsc.gov.in) | arunachal-pradesh-psc |
| 33 | [Assam PSC](https://apsc.nic.in) | assam-psc |
| 34 | [Bihar PSC](https://bpsc.bih.nic.in) | bihar-psc |
| 35 | [Chhattisgarh PSC](https://psc.cg.gov.in) | chhattisgarh-psc |
| 36 | [Goa PSC](https://goapsc.gov.in) | goa-psc |
| 37 | [Gujarat PSC](https://gpsc.gujarat.gov.in) | gujarat-psc |
| 38 | [Haryana PSC](https://hpsc.gov.in) | haryana-psc |
| 39 | [Himachal Pradesh PSC](https://hppsc.hp.gov.in) | himachal-pradesh-psc |
| 40 | [Jharkhand SSC](https://jssc.nic.in) | jharkhand-ssc |
| 41 | [Karnataka PSC](https://kpsc.karnataka.gov.in) | karnataka-psc |
| 42 | [Kerala PSC](https://www.keralapsc.gov.in) | kerala-psc |
| 43 | [Madhya Pradesh PSC](https://mppsc.mp.gov.in) | madhya-pradesh-psc |
| 44 | [Maharashtra PSC](https://mpsc.gov.in) | maharashtra-psc |
| 45 | [Manipur PSC](https://mpscmanipur.gov.in) | manipur-psc |
| 46 | [Meghalaya PSC](https://mpsc.nic.in) | meghalaya-psc |
| 47 | [Mizoram PSC](https://mpscmizoram.gov.in) | mizoram-psc |
| 48 | [Nagaland PSC](https://npsc.nagaland.gov.in) | nagaland-psc |
| 49 | [Odisha PSC](https://opsc.gov.in) | odisha-psc |
| 50 | [Punjab PSC](https://ppsc.gov.in) | punjab-psc |
| 51 | [Rajasthan PSC](https://rpsc.rajasthan.gov.in) | rajasthan-psc |
| 52 | [Sikkim PSC](https://spscskm.gov.in) | sikkim-psc |
| 53 | [Tamil Nadu PSC](https://www.tnpsc.gov.in) | tamil-nadu-psc |
| 54 | [Telangana State PSC](https://tspsc.gov.in) | telangana-state-psc |
| 55 | [Tripura PSC](https://tpsc.tripura.gov.in) | tripura-psc |
| 56 | [Uttar Pradesh PSC](https://uppsc.up.nic.in) | uttar-pradesh-psc |
| 57 | [Uttarakhand PSC](https://ukpsc.gov.in) | uttarakhand-psc |
| 58 | [West Bengal PSC](https://wbpsc.gov.in) | west-bengal-psc |
| 59 | [Delhi Subordinate Services Selection Board](https://dsssb.delhi.gov.in) | delhi-subordinate-services-selection-board |
| 60 | [Jammu & Kashmir PSC](https://jkpsc.nic.in) | jammu-kashmir-psc |
| 61 | [Chandigarh (UT) Recruitment](https://chandigarh.gov.in) | chandigarh-recruitment |
| 62 | [Puducherry PSC](https://psc.py.gov.in) | puducherry-psc |

## Company career pages (532 unique effective sources)

Status for every entry in this section: **Discovery catalog**. These pages begin inactive and become fetchable only when CampusPe verifies a supported public ATS endpoint or Schema.org `JobPosting` data.

| # | Name and URL | Slug | Declared provider | Catalog |
| --- | --- | --- | --- | --- |
| 1 | [Tata Consultancy Services (TCS)](https://www.tcs.com/careers) | tata-consultancy-services | Not specified | India careers directory |
| 2 | [Infosys](https://www.infosys.com/careers.html) | infosys | Not specified | India careers directory |
| 3 | [Wipro](https://careers.wipro.com) | wipro | Not specified | India careers directory |
| 4 | [HCLTech](https://www.hcltech.com/careers) | hcltech | Not specified | India careers directory |
| 5 | [Tech Mahindra](https://careers.techmahindra.com) | tech-mahindra | Not specified | India careers directory |
| 6 | [LTIMindtree](https://www.ltimindtree.com/careers) | ltimindtree | Not specified | India careers directory |
| 7 | [Cognizant](https://careers.cognizant.com) | cognizant | Not specified | India careers directory |
| 8 | [Mphasis](https://careers.mphasis.com) | mphasis | Not specified | India careers directory |
| 9 | [Persistent Systems](https://www.persistent.com/careers) | persistent-systems | Not specified | India careers directory |
| 10 | [Hexaware Technologies](https://hexaware.com/careers) | hexaware-technologies | Not specified | India careers directory |
| 11 | [Coforge](https://www.coforge.com/careers) | coforge | Not specified | India careers directory |
| 12 | [Zensar Technologies](https://www.zensar.com/careers) | zensar-technologies | Not specified | India careers directory |
| 13 | [L&T Technology Services](https://www.ltts.com/careers) | l-t-technology-services | Not specified | India careers directory |
| 14 | [Cyient](https://www.cyient.com/careers) | cyient | Not specified | India careers directory |
| 15 | [Birlasoft](https://www.birlasoft.com/careers) | birlasoft | Not specified | India careers directory |
| 16 | [Happiest Minds](https://www.happiestminds.com/careers) | happiest-minds | Not specified | India careers directory |
| 17 | [Sonata Software](https://www.sonata-software.com/careers) | sonata-software | Not specified | India careers directory |
| 18 | [Quess Corp](https://www.quesscorp.com/careers) | quess-corp | Not specified | India careers directory |
| 19 | [Firstsource Solutions](https://www.firstsource.com/careers) | firstsource-solutions | Not specified | India careers directory |
| 20 | [WNS Global Services](https://www.wns.com/careers) | wns-global-services | Not specified | India careers directory |
| 21 | [Genpact](https://www.genpact.com/careers) | genpact | Not specified | India careers directory |
| 22 | [EXL Service](https://www.exlservice.com/careers) | exl-service | Not specified | India careers directory |
| 23 | [Microsoft India](https://careers.microsoft.com) | microsoft-india | Not specified | India careers directory |
| 24 | [Google India](https://careers.google.com) | google-india | Not specified | India careers directory |
| 25 | [Amazon India](https://www.amazon.jobs) | amazon-india | Not specified | India careers directory |
| 26 | [IBM India](https://www.ibm.com/careers) | ibm-india | Not specified | India careers directory |
| 27 | [Accenture India](https://www.accenture.com/in-en/careers) | accenture-india | Not specified | India careers directory |
| 28 | [Capgemini India](https://www.capgemini.com/in-en/careers) | capgemini-india | Not specified | India careers directory |
| 29 | [Oracle India](https://www.oracle.com/in/careers) | oracle-india | Not specified | India careers directory |
| 30 | [SAP Labs India](https://jobs.sap.com) | sap-labs-india | Not specified | India careers directory |
| 31 | [Adobe India](https://www.adobe.com/careers.html) | adobe-india | Not specified | India careers directory |
| 32 | [Salesforce India](https://www.salesforce.com/company/careers) | salesforce-india | Not specified | India careers directory |
| 33 | [Dell Technologies India](https://jobs.dell.com) | dell-technologies-india | Not specified | India careers directory |
| 34 | [Intel India](https://jobs.intel.com) | intel-india | Not specified | India careers directory |
| 35 | [Cisco India](https://jobs.cisco.com) | cisco-india | Not specified | India careers directory |
| 36 | [VMware India](https://careers.vmware.com) | vmware-india | Not specified | India careers directory |
| 37 | [Goldman Sachs India](https://www.goldmansachs.com/careers) | goldman-sachs-india | Not specified | India careers directory |
| 38 | [JPMorgan Chase India](https://careers.jpmorgan.com) | jpmorgan-chase-india | Not specified | India careers directory |
| 39 | [Morgan Stanley India](https://www.morganstanley.com/careers) | morgan-stanley-india | Not specified | India careers directory |
| 40 | [Deutsche Bank India](https://careers.db.com) | deutsche-bank-india | Not specified | India careers directory |
| 41 | [Barclays India](https://home.barclays/careers) | barclays-india | Not specified | India careers directory |
| 42 | [American Express India](https://www.americanexpress.com/en-us/careers) | american-express-india | Not specified | India careers directory |
| 43 | [Walmart Global Tech India](https://tech.walmart.com/careers) | walmart-global-tech-india | Not specified | India careers directory |
| 44 | [Target India](https://india.target.com/careers) | target-india | Not specified | India careers directory |
| 45 | [Samsung R&D India](https://www.samsung.com/in/careers) | samsung-r-d-india | Not specified | India careers directory |
| 46 | [Qualcomm India](https://www.qualcomm.com/company/careers) | qualcomm-india | Not specified | India careers directory |
| 47 | [ServiceNow India](https://www.servicenow.com/careers.html) | servicenow-india | Not specified | India careers directory |
| 48 | [HDFC Bank](https://www.hdfcbank.com/personal/about-us/careers) | hdfc-bank | Not specified | India careers directory |
| 49 | [ICICI Bank](https://www.icicicareers.com) | icici-bank | Not specified | India careers directory |
| 50 | [State Bank of India (SBI)](https://bank.sbi/web/careers) | state-bank-of-india | Not specified | India careers directory |
| 51 | [Axis Bank](https://www.axisbank.com/careers) | axis-bank | Not specified | India careers directory |
| 52 | [Kotak Mahindra Bank](https://www.kotak.com/en/about-us/careers.html) | kotak-mahindra-bank | Not specified | India careers directory |
| 53 | [IndusInd Bank](https://www.indusind.com/in/en/personal/careers.html) | indusind-bank | Not specified | India careers directory |
| 54 | [Yes Bank](https://www.yesbank.in/careers) | yes-bank | Not specified | India careers directory |
| 55 | [Punjab National Bank](https://www.pnbindia.in/careers.html) | punjab-national-bank | Not specified | India careers directory |
| 56 | [Bank of Baroda](https://www.bankofbaroda.in/careers) | bank-of-baroda | Not specified | India careers directory |
| 57 | [Canara Bank](https://canarabank.com/user_pages/careers) | canara-bank | Not specified | India careers directory |
| 58 | [Union Bank of India](https://www.unionbankofindia.co.in/english/careers.aspx) | union-bank-of-india | Not specified | India careers directory |
| 59 | [IDFC First Bank](https://www.idfcfirstbank.com/careers) | idfc-first-bank | Not specified | India careers directory |
| 60 | [Federal Bank](https://www.federalbank.co.in/careers) | federal-bank | Not specified | India careers directory |
| 61 | [RBL Bank](https://www.rblbank.com/careers) | rbl-bank | Not specified | India careers directory |
| 62 | [Bandhan Bank](https://www.bandhanbank.com/careers) | bandhan-bank | Not specified | India careers directory |
| 63 | [IDBI Bank](https://www.idbibank.in/careers.aspx) | idbi-bank | Not specified | India careers directory |
| 64 | [Bajaj Finance](https://www.bajajfinserv.in/careers) | bajaj-finance | Not specified | India careers directory |
| 65 | [HDFC Life](https://www.hdfclife.com/careers) | hdfc-life | Not specified | India careers directory |
| 66 | [ICICI Prudential Life](https://www.iciciprulife.com/about-us/careers.html) | icici-prudential-life | Not specified | India careers directory |
| 67 | [SBI Life Insurance](https://www.sbilife.co.in/en/about-us/careers) | sbi-life-insurance | Not specified | India careers directory |
| 68 | [LIC of India](https://licindia.in/careers) | lic-of-india | Not specified | India careers directory |
| 69 | [Tata AIA Life](https://www.tataaia.com/careers.html) | tata-aia-life | Not specified | India careers directory |
| 70 | [Max Life Insurance](https://www.maxlifeinsurance.com/careers) | max-life-insurance | Not specified | India careers directory |
| 71 | [ICICI Lombard](https://www.icicilombard.com/careers) | icici-lombard | Not specified | India careers directory |
| 72 | [Muthoot Finance](https://www.muthootfinance.com/careers) | muthoot-finance | Not specified | India careers directory |
| 73 | [Shriram Finance](https://www.shriramfinance.in/careers) | shriram-finance | Not specified | India careers directory |
| 74 | [Cholamandalam Investment](https://www.cholamandalam.com/careers.aspx) | cholamandalam-investment | Not specified | India careers directory |
| 75 | [L&T Finance](https://www.ltfs.com/careers) | l-t-finance | Not specified | India careers directory |
| 76 | [PNB Housing Finance](https://www.pnbhousing.com/careers) | pnb-housing-finance | Not specified | India careers directory |
| 77 | [Tata Group](https://www.tata.com/careers) | tata-group | Not specified | India careers directory |
| 78 | [Reliance Industries](https://careers.ril.com) | reliance-industries | Not specified | India careers directory |
| 79 | [Aditya Birla Group](https://www.adityabirlacareers.com) | aditya-birla-group | Not specified | India careers directory |
| 80 | [Mahindra Group](https://www.mahindra.com/careers) | mahindra-group | Not specified | India careers directory |
| 81 | [Larsen & Toubro (L&T)](https://www.larsentoubro.com/corporate/careers) | larsen-toubro | Not specified | India careers directory |
| 82 | [Godrej Group](https://www.godrejcareers.com) | godrej-group | Not specified | India careers directory |
| 83 | [Adani Group](https://www.adanicareers.com) | adani-group | Not specified | India careers directory |
| 84 | [Bajaj Group](https://www.bajajgroup.co.in/careers) | bajaj-group | Not specified | India careers directory |
| 85 | [JSW Group](https://www.jsw.in/careers) | jsw-group | Not specified | India careers directory |
| 86 | [Hinduja Group](https://www.hindujagroup.com/careers) | hinduja-group | Not specified | India careers directory |
| 87 | [ITC Limited](https://www.itcportal.com/careers/careers-landing-page.aspx) | itc-limited | Not specified | India careers directory |
| 88 | [RPG Group](https://www.rpggroup.com/careers) | rpg-group | Not specified | India careers directory |
| 89 | [Wadia Group](https://www.wadiagroup.com/careers) | wadia-group | Not specified | India careers directory |
| 90 | [Essar Group](https://www.essar.com/careers) | essar-group | Not specified | India careers directory |
| 91 | [Vedanta Group](https://www.vedantalimited.com/careers) | vedanta-group | Not specified | India careers directory |
| 92 | [Hindustan Unilever (HUL)](https://www.hul.co.in/careers) | hindustan-unilever | Not specified | India careers directory |
| 93 | [ITC FMCG](https://www.itcportal.com/careers) | itc-fmcg | Not specified | India careers directory |
| 94 | [Nestlé India](https://www.nestle.in/jobs) | nestl-india | Not specified | India careers directory |
| 95 | [Britannia Industries](https://careers.britannia.co.in) | britannia-industries | Not specified | India careers directory |
| 96 | [Dabur India](https://www.dabur.com/in/en-us/careers) | dabur-india | Not specified | India careers directory |
| 97 | [Marico](https://marico.com/india/careers) | marico | Not specified | India careers directory |
| 98 | [Godrej Consumer Products](https://www.godrejcp.com/careers) | godrej-consumer-products | Not specified | India careers directory |
| 99 | [Emami](https://www.emamiltd.in/careers) | emami | Not specified | India careers directory |
| 100 | [Colgate-Palmolive India](https://www.colgatepalmolive.co.in/careers) | colgate-palmolive-india | Not specified | India careers directory |
| 101 | [Procter & Gamble India](https://www.pgcareers.com) | procter-gamble-india | Not specified | India careers directory |
| 102 | [Patanjali Ayurved](https://www.patanjaliayurved.org/careers) | patanjali-ayurved | Not specified | India careers directory |
| 103 | [Amul (GCMMF)](https://amul.com/careers.html) | amul | Not specified | India careers directory |
| 104 | [Parle Products](https://www.parleproducts.com/careers) | parle-products | Not specified | India careers directory |
| 105 | [Haldiram's](https://haldiram.com/careers.html) | haldiram-s | Not specified | India careers directory |
| 106 | [PepsiCo India](https://www.pepsicoindiajobs.com) | pepsico-india | Not specified | India careers directory |
| 107 | [Coca-Cola India](https://www.coca-colaindia.com/careers) | coca-cola-india | Not specified | India careers directory |
| 108 | [Tata Motors](https://careers.tatamotors.com) | tata-motors | Not specified | India careers directory |
| 109 | [Maruti Suzuki India](https://www.marutisuzuki.com/corporate/careers) | maruti-suzuki-india | Not specified | India careers directory |
| 110 | [Bajaj Auto](https://www.bajajauto.com/careers) | bajaj-auto | Not specified | India careers directory |
| 111 | [Hero MotoCorp](https://www.heromotocorp.com/en-in/about-us/careers.html) | hero-motocorp | Not specified | India careers directory |
| 112 | [TVS Motor Company](https://www.tvsmotor.com/careers) | tvs-motor-company | Not specified | India careers directory |
| 113 | [Ashok Leyland](https://www.ashokleyland.com/careers) | ashok-leyland | Not specified | India careers directory |
| 114 | [Eicher Motors / Royal Enfield](https://www.eichermotors.com/careers) | eicher-motors-royal-enfield | Not specified | India careers directory |
| 115 | [Hyundai Motor India](https://www.hyundai.com/in/en/careers) | hyundai-motor-india | Not specified | India careers directory |
| 116 | [Honda Cars India](https://www.hondacarindia.com/careers) | honda-cars-india | Not specified | India careers directory |
| 117 | [Toyota Kirloskar Motor](https://www.toyotabharat.com/careers) | toyota-kirloskar-motor | Not specified | India careers directory |
| 118 | [Bosch India](https://www.bosch.in/careers) | bosch-india | Not specified | India careers directory |
| 119 | [Siemens India](https://www.siemens.com/in/en/company/jobs.html) | siemens-india | Not specified | India careers directory |
| 120 | [ABB India](https://global.abb/group/en/careers) | abb-india | Not specified | India careers directory |
| 121 | [Cummins India](https://www.cummins.com/careers) | cummins-india | Not specified | India careers directory |
| 122 | [BHEL](https://www.bhel.com/career) | bhel | Not specified | India careers directory |
| 123 | [Havells India](https://www.havells.com/en/corporate/careers.html) | havells-india | Not specified | India careers directory |
| 124 | [Voltas](https://www.voltas.com/careers) | voltas | Not specified | India careers directory |
| 125 | [Bharat Forge](https://www.bharatforge.com/careers) | bharat-forge | Not specified | India careers directory |
| 126 | [Motherson Group](https://www.motherson.com/careers) | motherson-group | Not specified | India careers directory |
| 127 | [Sun Pharmaceutical](https://sunpharma.com/careers) | sun-pharmaceutical | Not specified | India careers directory |
| 128 | [Dr. Reddy's Laboratories](https://careers.drreddys.com) | dr-reddy-s-laboratories | Not specified | India careers directory |
| 129 | [Cipla](https://www.cipla.com/careers) | cipla | Not specified | India careers directory |
| 130 | [Lupin](https://www.lupin.com/careers) | lupin | Not specified | India careers directory |
| 131 | [Aurobindo Pharma](https://www.aurobindo.com/careers) | aurobindo-pharma | Not specified | India careers directory |
| 132 | [Divi's Laboratories](https://www.divislabs.com/careers) | divi-s-laboratories | Not specified | India careers directory |
| 133 | [Torrent Pharmaceuticals](https://www.torrentpharma.com/careers) | torrent-pharmaceuticals | Not specified | India careers directory |
| 134 | [Zydus Lifesciences](https://www.zyduslife.com/careers) | zydus-lifesciences | Not specified | India careers directory |
| 135 | [Biocon](https://www.biocon.com/careers) | biocon | Not specified | India careers directory |
| 136 | [Mankind Pharma](https://www.mankindpharma.com/careers) | mankind-pharma | Not specified | India careers directory |
| 137 | [Apollo Hospitals](https://www.apollohospitals.com/careers) | apollo-hospitals | Not specified | India careers directory |
| 138 | [Fortis Healthcare](https://www.fortishealthcare.com/careers) | fortis-healthcare | Not specified | India careers directory |
| 139 | [Max Healthcare](https://www.maxhealthcare.in/careers) | max-healthcare | Not specified | India careers directory |
| 140 | [Narayana Health](https://www.narayanahealth.org/careers) | narayana-health | Not specified | India careers directory |
| 141 | [Manipal Hospitals](https://www.manipalhospitals.com/careers) | manipal-hospitals | Not specified | India careers directory |
| 142 | [AIIMS (govt hospitals)](https://www.aiims.edu/en/recruitment.html) | aiims | Not specified | India careers directory |
| 143 | [Flipkart](https://www.flipkartcareers.com) | flipkart | Not specified | India careers directory |
| 144 | [Amazon India](https://www.amazon.jobs/en/locations/india) | amazon-india-2 | Not specified | India careers directory |
| 145 | [Zomato](https://www.zomato.com/careers) | zomato | Not specified | India careers directory |
| 146 | [Swiggy](https://careers.swiggy.com) | swiggy | Not specified | India careers directory |
| 147 | [Paytm](https://paytm.com/careers) | paytm | Not specified | India careers directory |
| 148 | [PhonePe](https://www.phonepe.com/careers) | phonepe | Not specified | India careers directory |
| 149 | [Ola](https://www.olacabs.com/careers) | ola | Not specified | India careers directory |
| 150 | [Uber India](https://www.uber.com/us/en/careers) | uber-india | Not specified | India careers directory |
| 151 | [Byju's](https://byjus.com/careers) | byju-s | Not specified | India careers directory |
| 152 | [Unacademy](https://unacademy.com/careers) | unacademy | Not specified | India careers directory |
| 153 | [Meesho](https://www.meesho.io/careers) | meesho | Not specified | India careers directory |
| 154 | [Nykaa](https://www.nykaa.com/careers) | nykaa | Not specified | India careers directory |
| 155 | [CRED](https://cred.club/careers) | cred | Not specified | India careers directory |
| 156 | [Razorpay](https://razorpay.com/jobs) | razorpay | Not specified | India careers directory |
| 157 | [Zerodha](https://zerodha.com/careers) | zerodha | Not specified | India careers directory |
| 158 | [Groww](https://groww.in/careers) | groww | Not specified | India careers directory |
| 159 | [Urban Company](https://www.urbancompany.com/careers) | urban-company | Not specified | India careers directory |
| 160 | [Dream11](https://dream11.com/careers) | dream11 | Not specified | India careers directory |
| 161 | [Delhivery](https://www.delhivery.com/careers) | delhivery | Not specified | India careers directory |
| 162 | [BigBasket](https://www.bigbasket.com/careers) | bigbasket | Not specified | India careers directory |
| 163 | [Zepto](https://www.zeptonow.com/careers) | zepto | Not specified | India careers directory |
| 164 | [Blinkit](https://blinkit.com/careers) | blinkit | Not specified | India careers directory |
| 165 | [PolicyBazaar](https://www.policybazaar.com/careers) | policybazaar | Not specified | India careers directory |
| 166 | [Lenskart](https://www.lenskart.com/careers) | lenskart | Not specified | India careers directory |
| 167 | [Freshworks](https://www.freshworks.com/company/careers) | freshworks | Not specified | India careers directory |
| 168 | [Zoho Corporation](https://www.zoho.com/careers) | zoho-corporation | Not specified | India careers directory |
| 169 | [InMobi](https://www.inmobi.com/company/careers) | inmobi | Not specified | India careers directory |
| 170 | [ShareChat](https://sharechat.com/careers) | sharechat | Not specified | India careers directory |
| 171 | [upGrad](https://www.upgrad.com/careers) | upgrad | Not specified | India careers directory |
| 172 | [Ather Energy](https://www.atherenergy.com/careers) | ather-energy | Not specified | India careers directory |
| 173 | [Ola Electric](https://www.olaelectric.com/careers) | ola-electric | Not specified | India careers directory |
| 174 | [Physics Wallah (PW)](https://www.pw.live/careers) | physics-wallah | Not specified | India careers directory |
| 175 | [Rapido](https://www.rapido.bike/careers) | rapido | Not specified | India careers directory |
| 176 | [Pine Labs](https://www.pinelabs.com/careers) | pine-labs | Not specified | India careers directory |
| 177 | [Cars24](https://www.cars24.com/careers) | cars24 | Not specified | India careers directory |
| 178 | [Spinny](https://www.spinny.com/careers) | spinny | Not specified | India careers directory |
| 179 | [Licious](https://www.licious.in/careers) | licious | Not specified | India careers directory |
| 180 | [Dunzo](https://www.dunzo.com/careers) | dunzo | Not specified | India careers directory |
| 181 | [Myntra](https://careers.myntra.com) | myntra | Not specified | India careers directory |
| 182 | [Snapdeal](https://www.snapdeal.com/careers) | snapdeal | Not specified | India careers directory |
| 183 | [Reliance Jio](https://www.jio.com/careers) | reliance-jio | Not specified | India careers directory |
| 184 | [Bharti Airtel](https://www.airtel.in/careers) | bharti-airtel | Not specified | India careers directory |
| 185 | [Vodafone Idea (Vi)](https://www.myvi.in/careers) | vodafone-idea | Not specified | India careers directory |
| 186 | [BSNL](https://www.bsnl.co.in/careers) | bsnl | Not specified | India careers directory |
| 187 | [Star India / Disney+ Hotstar](https://www.disneycareers.com) | star-india-disney-hotstar | Not specified | India careers directory |
| 188 | [Zee Entertainment](https://www.zee.com/careers) | zee-entertainment | Not specified | India careers directory |
| 189 | [Sony Pictures Networks India](https://www.sonypicturesnetworks.com/careers) | sony-pictures-networks-india | Not specified | India careers directory |
| 190 | [Network18 / TV18](https://www.network18online.com/careers) | network18-tv18 | Not specified | India careers directory |
| 191 | [Times Internet / Times Group](https://timesgroup.com/careers) | times-internet-times-group | Not specified | India careers directory |
| 192 | [The Indian Express](https://indianexpress.com/careers) | the-indian-express | Not specified | India careers directory |
| 193 | [IndiGo (InterGlobe Aviation)](https://www.goindigo.in/information/careers.html) | indigo | Not specified | India careers directory |
| 194 | [Air India](https://www.airindia.com/in/en/careers.html) | air-india | Not specified | India careers directory |
| 195 | [SpiceJet](https://www.spicejet.com/careers) | spicejet | Not specified | India careers directory |
| 196 | [Akasa Air](https://www.akasaair.com/careers) | akasa-air | Not specified | India careers directory |
| 197 | [MakeMyTrip](https://careers.makemytrip.com) | makemytrip | Not specified | India careers directory |
| 198 | [Yatra Online](https://www.yatra.com/careers) | yatra-online | Not specified | India careers directory |
| 199 | [Cleartrip](https://www.cleartrip.com/careers) | cleartrip | Not specified | India careers directory |
| 200 | [OYO Rooms](https://www.oyorooms.com/careers) | oyo-rooms | Not specified | India careers directory |
| 201 | [Taj Hotels (IHCL)](https://www.ihcltata.com/careers) | taj-hotels | Not specified | India careers directory |
| 202 | [Oberoi Hotels](https://www.oberoihotels.com/careers) | oberoi-hotels | Not specified | India careers directory |
| 203 | [ITC Hotels](https://www.itchotels.com/careers) | itc-hotels | Not specified | India careers directory |
| 204 | [Marriott India](https://careers.marriott.com) | marriott-india | Not specified | India careers directory |
| 205 | [Lemon Tree Hotels](https://www.lemontreehotels.com/careers) | lemon-tree-hotels | Not specified | India careers directory |
| 206 | [Future Retail (Big Bazaar legacy)](https://www.futuregroup.in/careers) | future-retail | Not specified | India careers directory |
| 207 | [Titan Company](https://www.titancompany.in/careers) | titan-company | Not specified | India careers directory |
| 208 | [Tata CLiQ](https://www.tatacliq.com/careers) | tata-cliq | Not specified | India careers directory |
| 209 | [DMart (Avenue Supermarts)](https://www.dmartindia.com/careers) | dmart | Not specified | India careers directory |
| 210 | [Trent (Westside/Zudio)](https://www.trentlimited.com/careers) | trent | Not specified | India careers directory |
| 211 | [Shoppers Stop](https://www.shoppersstop.com/careers) | shoppers-stop | Not specified | India careers directory |
| 212 | [Aditya Birla Fashion & Retail](https://www.abfrl.com/careers) | aditya-birla-fashion-retail | Not specified | India careers directory |
| 213 | [V-Mart Retail](https://www.vmartretail.com/careers) | v-mart-retail | Not specified | India careers directory |
| 214 | [Landmark Group India](https://www.landmarkgroup.com/careers) | landmark-group-india | Not specified | India careers directory |
| 215 | [Indian Oil Corporation (IOCL)](https://iocl.com/careers) | indian-oil-corporation | Not specified | India careers directory |
| 216 | [Bharat Petroleum (BPCL)](https://www.bharatpetroleum.in/careers) | bharat-petroleum | Not specified | India careers directory |
| 217 | [Hindustan Petroleum (HPCL)](https://www.hindustanpetroleum.com/careers) | hindustan-petroleum | Not specified | India careers directory |
| 218 | [ONGC](https://www.ongcindia.com/web/eng/careers) | ongc | Not specified | India careers directory |
| 219 | [GAIL India](https://www.gailonline.com/careers.html) | gail-india | Not specified | India careers directory |
| 220 | [NTPC Limited](https://www.ntpc.co.in/careers) | ntpc-limited | Not specified | India careers directory |
| 221 | [Power Grid Corporation](https://www.powergrid.in/careers) | power-grid-corporation | Not specified | India careers directory |
| 222 | [Adani Green Energy](https://www.adanigreenenergy.com/careers) | adani-green-energy | Not specified | India careers directory |
| 223 | [Tata Power](https://www.tatapower.com/careers) | tata-power | Not specified | India careers directory |
| 224 | [ReNew Power](https://www.renewpower.in/careers) | renew-power | Not specified | India careers directory |
| 225 | [Tata Steel](https://www.tatasteel.com/careers) | tata-steel | Not specified | India careers directory |
| 226 | [JSW Steel](https://www.jsw.in/steel/careers) | jsw-steel | Not specified | India careers directory |
| 227 | [Steel Authority of India (SAIL)](https://sail.co.in/en/careers) | steel-authority-of-india | Not specified | India careers directory |
| 228 | [Hindalco Industries](https://www.hindalco.com/careers) | hindalco-industries | Not specified | India careers directory |
| 229 | [UltraTech Cement](https://www.ultratechcement.com/careers) | ultratech-cement | Not specified | India careers directory |
| 230 | [Ambuja Cements](https://www.ambujacement.com/careers) | ambuja-cements | Not specified | India careers directory |
| 231 | [ACC Limited](https://www.acclimited.com/careers) | acc-limited | Not specified | India careers directory |
| 232 | [Coal India Limited](https://www.coalindia.in/career.aspx) | coal-india-limited | Not specified | India careers directory |
| 233 | [NMDC Limited](https://www.nmdc.co.in/careers) | nmdc-limited | Not specified | India careers directory |
| 234 | [DLF Limited](https://www.dlf.in/careers) | dlf-limited | Not specified | India careers directory |
| 235 | [Godrej Properties](https://www.godrejproperties.com/careers) | godrej-properties | Not specified | India careers directory |
| 236 | [Prestige Group](https://www.prestigeconstructions.com/careers) | prestige-group | Not specified | India careers directory |
| 237 | [Oberoi Realty](https://www.oberoirealty.com/careers) | oberoi-realty | Not specified | India careers directory |
| 238 | [Sobha Limited](https://www.sobha.com/careers) | sobha-limited | Not specified | India careers directory |
| 239 | [Brigade Group](https://www.brigadegroup.com/careers) | brigade-group | Not specified | India careers directory |
| 240 | [Lodha Group (Macrotech)](https://www.lodhagroup.com/careers) | lodha-group | Not specified | India careers directory |
| 241 | [GMR Group](https://www.gmrgroup.in/careers) | gmr-group | Not specified | India careers directory |
| 242 | [GVK Group](https://www.gvk.com/careers) | gvk-group | Not specified | India careers directory |
| 243 | [IRB Infrastructure](https://www.irb.co.in/careers) | irb-infrastructure | Not specified | India careers directory |
| 244 | [Hindustan Aeronautics Limited (HAL)](https://hal-india.co.in/careers) | hindustan-aeronautics-limited | Not specified | India careers directory |
| 245 | [Bharat Electronics (BEL)](https://bel-india.in/careers) | bharat-electronics | Not specified | India careers directory |
| 246 | [Bharat Dynamics Limited](https://www.bdl-india.in/careers) | bharat-dynamics-limited | Not specified | India careers directory |
| 247 | [Defence Research & Development Organisation (DRDO)](https://www.drdo.gov.in/careers) | defence-research-development-organisation | Not specified | India careers directory |
| 248 | [Indian Space Research Organisation (ISRO)](https://www.isro.gov.in/Careers.html) | indian-space-research-organisation | Not specified | India careers directory |
| 249 | [Railway Recruitment Boards](https://www.rrbcdg.gov.in) | railway-recruitment-boards | Not specified | India careers directory |
| 250 | [Staff Selection Commission (SSC)](https://ssc.nic.in) | staff-selection-commission | Not specified | India careers directory |
| 251 | [Union Public Service Commission (UPSC)](https://upsc.gov.in) | union-public-service-commission | Not specified | India careers directory |
| 252 | [Institute of Banking Personnel Selection (IBPS)](https://www.ibps.in) | institute-of-banking-personnel-selection | Not specified | India careers directory |
| 253 | [Airports Authority of India (AAI)](https://www.aai.aero/en/careers) | airports-authority-of-india | Not specified | India careers directory |
| 254 | [Food Corporation of India (FCI)](https://fci.gov.in/careers) | food-corporation-of-india | Not specified | India careers directory |
| 255 | [Pidilite Industries](https://www.pidilite.com/careers) | pidilite-industries | Not specified | India careers directory |
| 256 | [UPL Limited](https://www.upl-ltd.com/careers) | upl-limited | Not specified | India careers directory |
| 257 | [Asian Paints](https://www.asianpaints.com/careers.html) | asian-paints | Not specified | India careers directory |
| 258 | [Berger Paints](https://www.bergerpaints.com/careers) | berger-paints | Not specified | India careers directory |
| 259 | [Deepak Nitrite](https://www.deepakgroup.com/careers) | deepak-nitrite | Not specified | India careers directory |
| 260 | [Coromandel International](https://www.coromandel.biz/careers) | coromandel-international | Not specified | India careers directory |
| 261 | [Tata Chemicals](https://www.tatachemicals.com/careers) | tata-chemicals | Not specified | India careers directory |
| 262 | [SRF Limited](https://www.srf.com/careers) | srf-limited | Not specified | India careers directory |
| 263 | [Aarti Industries](https://www.aarti-industries.com/careers) | aarti-industries | Not specified | India careers directory |
| 264 | [GNFC Limited](https://www.gnfc.in/careers) | gnfc-limited | Not specified | India careers directory |
| 265 | [Arvind Limited](https://www.arvind.com/careers) | arvind-limited | Not specified | India careers directory |
| 266 | [Raymond Group](https://www.raymond.in/careers) | raymond-group | Not specified | India careers directory |
| 267 | [Welspun Group](https://www.welspun.com/careers) | welspun-group | Not specified | India careers directory |
| 268 | [Vardhman Textiles](https://www.vardhman.com/careers) | vardhman-textiles | Not specified | India careers directory |
| 269 | [Page Industries (Jockey)](https://www.pageind.com/careers) | page-industries | Not specified | India careers directory |
| 270 | [Trident Group](https://www.tridentindia.com/careers) | trident-group | Not specified | India careers directory |
| 271 | [Bombay Dyeing](https://www.bombaydyeing.com/careers) | bombay-dyeing | Not specified | India careers directory |
| 272 | [Vedantu](https://vedantu.com/careers) | vedantu | Not specified | India careers directory |
| 273 | [Simplilearn](https://www.simplilearn.com/careers) | simplilearn | Not specified | India careers directory |
| 274 | [Great Learning](https://www.mygreatlearning.com/careers) | great-learning | Not specified | India careers directory |
| 275 | [Toppr](https://www.toppr.com/careers) | toppr | Not specified | India careers directory |
| 276 | [Extramarks](https://www.extramarks.com/careers) | extramarks | Not specified | India careers directory |
| 277 | [BharatPe](https://bharatpe.com/careers) | bharatpe | Not specified | India careers directory |
| 278 | [Cashfree Payments](https://www.cashfree.com/careers) | cashfree-payments | Not specified | India careers directory |
| 279 | [Blue Dart Express](https://www.bluedart.com/careers) | blue-dart-express | Not specified | India careers directory |
| 280 | [DTDC Express](https://www.dtdc.in/careers) | dtdc-express | Not specified | India careers directory |
| 281 | [Ecom Express](https://www.ecomexpress.in/careers) | ecom-express | Not specified | India careers directory |
| 282 | [Mahindra Logistics](https://www.mahindralogistics.com/careers) | mahindra-logistics | Not specified | India careers directory |
| 283 | [Container Corporation of India (CONCOR)](https://www.concorindia.co.in/career.aspx) | container-corporation-of-india | Not specified | India careers directory |
| 284 | [Gati Limited](https://www.gati.com/careers) | gati-limited | Not specified | India careers directory |
| 285 | [XpressBees](https://www.xpressbees.com/careers) | xpressbees | Not specified | India careers directory |
| 286 | [Adani Wilmar](https://www.adaniwilmar.com/careers) | adani-wilmar | Not specified | India careers directory |
| 287 | [Godrej Agrovet](https://www.godrejagrovet.com/careers) | godrej-agrovet | Not specified | India careers directory |
| 288 | [Jubilant FoodWorks (Domino's India)](https://www.jubilantfoodworks.com/careers) | jubilant-foodworks | Not specified | India careers directory |
| 289 | [Deloitte India](https://www2.deloitte.com/in/en/careers.html) | deloitte-india | Not specified | India careers directory |
| 290 | [PwC India](https://www.pwc.in/careers.html) | pwc-india | Not specified | India careers directory |
| 291 | [EY India](https://www.ey.com/en_in/careers) | ey-india | Not specified | India careers directory |
| 292 | [KPMG India](https://home.kpmg/in/en/home/careers.html) | kpmg-india | Not specified | India careers directory |
| 293 | [McKinsey & Company India](https://www.mckinsey.com/careers) | mckinsey-company-india | Not specified | India careers directory |
| 294 | [Boston Consulting Group India](https://careers.bcg.com) | boston-consulting-group-india | Not specified | India careers directory |
| 295 | [Bain & Company India](https://www.bain.com/careers) | bain-company-india | Not specified | India careers directory |
| 296 | [Grant Thornton India](https://www.grantthornton.in/careers) | grant-thornton-india | Not specified | India careers directory |
| 297 | [BDO India](https://www.bdo.in/en-gb/careers) | bdo-india | Not specified | India careers directory |
| 298 | [RSM India](https://www.rsm.global/india/careers) | rsm-india | Not specified | India careers directory |
| 299 | [Protiviti India](https://www.protiviti.com/in-en/careers) | protiviti-india | Not specified | India careers directory |
| 300 | [WTW (Willis Towers Watson) India](https://careers.wtwco.com) | wtw-india | Not specified | India careers directory |
| 301 | [Mercer India](https://www.mercer.com/en-in/careers) | mercer-india | Not specified | India careers directory |
| 302 | [Aon India](https://careers.aon.com) | aon-india | Not specified | India careers directory |
| 303 | [New India Assurance](https://www.newindia.co.in/portal/careers) | new-india-assurance | Not specified | India careers directory |
| 304 | [National Insurance Company](https://nationalinsurance.nic.co.in/en/careers) | national-insurance-company | Not specified | India careers directory |
| 305 | [Star Health Insurance](https://www.starhealth.in/careers) | star-health-insurance | Not specified | India careers directory |
| 306 | [Niva Bupa Health Insurance](https://www.nivabupa.com/careers) | niva-bupa-health-insurance | Not specified | India careers directory |
| 307 | [HDFC ERGO General Insurance](https://www.hdfcergo.com/careers) | hdfc-ergo-general-insurance | Not specified | India careers directory |
| 308 | [Bajaj Allianz General Insurance](https://www.bajajallianz.com/careers.html) | bajaj-allianz-general-insurance | Not specified | India careers directory |
| 309 | [TATA AIG General Insurance](https://www.tataaig.com/careers) | tata-aig-general-insurance | Not specified | India careers directory |
| 310 | [Care Health Insurance](https://www.careinsurance.com/careers) | care-health-insurance | Not specified | India careers directory |
| 311 | [Go Digit General Insurance](https://www.godigit.com/careers) | go-digit-general-insurance | Not specified | India careers directory |
| 312 | [Reliance General Insurance](https://www.reliancegeneral.co.in/careers) | reliance-general-insurance | Not specified | India careers directory |
| 313 | [Netflix India](https://jobs.netflix.com) | netflix-india | Not specified | India careers directory |
| 314 | [Nazara Technologies](https://www.nazara.com/careers) | nazara-technologies | Not specified | India careers directory |
| 315 | [Games24x7](https://games24x7.com/careers) | games24x7 | Not specified | India careers directory |
| 316 | [Dream Sports (Dream11)](https://dreamsports.group/careers) | dream-sports | Not specified | India careers directory |
| 317 | [MPL (Mobile Premier League)](https://www.mpl.live/careers) | mpl | Not specified | India careers directory |
| 318 | [Zee5](https://www.zee5.com/careers) | zee5 | Not specified | India careers directory |
| 319 | [Balaji Telefilms](https://www.balajitelefilms.com/careers) | balaji-telefilms | Not specified | India careers directory |
| 320 | [Red Chillies Entertainment](https://redchillies.com/careers) | red-chillies-entertainment | Not specified | India careers directory |
| 321 | [T-Series (Super Cassettes)](https://www.tseries.in/careers) | t-series | Not specified | India careers directory |
| 322 | [Tata Electronics](https://www.tataelectronics.com/careers) | tata-electronics | Not specified | India careers directory |
| 323 | [Micron Technology India](https://www.micron.com/careers) | micron-technology-india | Not specified | India careers directory |
| 324 | [Dixon Technologies](https://www.dixoninfo.com/careers) | dixon-technologies | Not specified | India careers directory |
| 325 | [Exide Industries](https://www.exideindustries.com/careers) | exide-industries | Not specified | India careers directory |
| 326 | [Amara Raja Batteries](https://www.amararajabatteries.com/careers) | amara-raja-batteries | Not specified | India careers directory |
| 327 | [Waaree Energies](https://www.waaree.com/careers) | waaree-energies | Not specified | India careers directory |
| 328 | [Suzlon Energy](https://www.suzlon.com/careers) | suzlon-energy | Not specified | India careers directory |
| 329 | [Premier Energies](https://www.premierenergies.com/careers) | premier-energies | Not specified | India careers directory |
| 330 | [TeamLease Services](https://www.teamlease.com/careers) | teamlease-services | Not specified | India careers directory |
| 331 | [Randstad India](https://www.randstad.in/careers) | randstad-india | Not specified | India careers directory |
| 332 | [ManpowerGroup India](https://www.manpowergroup.co.in/careers) | manpowergroup-india | Not specified | India careers directory |
| 333 | [Adecco India](https://www.adecco.com/en-in/careers) | adecco-india | Not specified | India careers directory |
| 334 | [Innovsource](https://www.innovsource.com/careers) | innovsource | Not specified | India careers directory |
| 335 | [ABC Consultants](https://www.abcconsultants.in/careers) | abc-consultants | Not specified | India careers directory |
| 336 | [Kelly Services India](https://www.kellyservices.co.in/careers) | kelly-services-india | Not specified | India careers directory |
| 337 | [Michael Page India](https://www.michaelpage.co.in/careers) | michael-page-india | Not specified | India careers directory |
| 338 | [Antal International India](https://www.antal.com/careers) | antal-international-india | Not specified | India careers directory |
| 339 | [Boat Lifestyle](https://www.boat-lifestyle.com/careers) | boat-lifestyle | Not specified | India careers directory |
| 340 | [Mamaearth (Honasa Consumer)](https://www.mamaearth.in/careers) | mamaearth | Not specified | India careers directory |
| 341 | [Sugar Cosmetics](https://www.sugarcosmetics.com/careers) | sugar-cosmetics | Not specified | India careers directory |
| 342 | [Wow Skin Science](https://www.wowskinscience.com/careers) | wow-skin-science | Not specified | India careers directory |
| 343 | [Mokobara](https://www.mokobara.com/careers) | mokobara | Not specified | India careers directory |
| 344 | [The Man Company](https://themancompany.com/careers) | the-man-company | Not specified | India careers directory |
| 345 | [Country Delight](https://www.countrydelight.in/careers) | country-delight | Not specified | India careers directory |
| 346 | [Rebel Foods](https://www.rebelfoods.com/careers) | rebel-foods | Not specified | India careers directory |
| 347 | [PharmEasy](https://pharmeasy.in/careers) | pharmeasy | Not specified | India careers directory |
| 348 | [1mg (Tata 1mg)](https://www.1mg.com/careers) | 1mg | Not specified | India careers directory |
| 349 | [Practo](https://www.practo.com/careers) | practo | Not specified | India careers directory |
| 350 | [Netmeds](https://www.netmeds.com/careers) | netmeds | Not specified | India careers directory |
| 351 | [Cure.fit (Cult.fit)](https://www.cult.fit/careers) | cure-fit | Not specified | India careers directory |
| 352 | [DeHaat](https://www.dehaat.in/careers) | dehaat | Not specified | India careers directory |
| 353 | [Ninjacart](https://ninjacart.in/careers) | ninjacart | Not specified | India careers directory |
| 354 | [WayCool Foods](https://waycool.in/careers) | waycool-foods | Not specified | India careers directory |
| 355 | [Skyroot Aerospace](https://www.skyroot.in/careers) | skyroot-aerospace | Not specified | India careers directory |
| 356 | [Agnikul Cosmos](https://www.agnikul.in/careers) | agnikul-cosmos | Not specified | India careers directory |
| 357 | [Ideaforge Technology](https://ideaforgetech.com/careers) | ideaforge-technology | Not specified | India careers directory |
| 358 | [Rocketium](https://www.rocketium.com/careers) | rocketium | Not specified | India careers directory |
| 359 | [Microsoft](https://jobs.careers.microsoft.com) | microsoft | Custom | Attached workbook |
| 360 | [Apple](https://jobs.apple.com) | apple | Custom | Attached workbook |
| 361 | [Meta](https://www.metacareers.com) | meta | Custom | Attached workbook |
| 362 | [Oracle](https://careers.oracle.com) | oracle | Oracle Recruiting | Attached workbook |
| 363 | [Salesforce](https://careers.salesforce.com) | salesforce | Custom | Attached workbook |
| 364 | [Adobe](https://careers.adobe.com) | adobe | Workday | Attached workbook |
| 365 | [Nvidia](https://www.nvidia.com/en-us/about-nvidia/careers) | nvidia | Workday | Attached workbook |
| 366 | [HP Inc.](https://jobs.hp.com) | hp-inc | Custom | Attached workbook |
| 367 | [VMware (Broadcom)](https://careers.broadcom.com) | vmware-broadcom | Custom | Attached workbook |
| 368 | [ServiceNow](https://careers.servicenow.com) | servicenow | Custom | Attached workbook |
| 369 | [Workday](https://workday.wd5.myworkdayjobs.com/Workday) | workday | Workday | Attached workbook |
| 370 | [Snowflake](https://careers.snowflake.com) | snowflake | Greenhouse | Attached workbook |
| 371 | [Databricks](https://www.databricks.com/company/careers) | databricks | Greenhouse | Attached workbook |
| 372 | [Palantir](https://www.palantir.com/careers) | palantir | Custom | Attached workbook |
| 373 | [Palo Alto Networks](https://jobs.paloaltonetworks.com) | palo-alto-networks | Workday | Attached workbook |
| 374 | [CrowdStrike](https://www.crowdstrike.com/careers) | crowdstrike | Workday | Attached workbook |
| 375 | [Zscaler](https://www.zscaler.com/careers) | zscaler | Custom | Attached workbook |
| 376 | [Splunk](https://www.splunk.com/en_us/careers.html) | splunk | Custom | Attached workbook |
| 377 | [Atlassian](https://www.atlassian.com/company/careers) | atlassian | Custom | Attached workbook |
| 378 | [Slack](https://slack.com/careers) | slack | Custom | Attached workbook |
| 379 | [Zoom](https://careers.zoom.us) | zoom | Custom | Attached workbook |
| 380 | [Twilio](https://www.twilio.com/en-us/company/jobs) | twilio | Greenhouse | Attached workbook |
| 381 | [Dropbox](https://jobs.dropbox.com) | dropbox | Greenhouse | Attached workbook |
| 382 | [Box](https://www.box.com/careers) | box | Greenhouse | Attached workbook |
| 383 | [HubSpot](https://www.hubspot.com/careers) | hubspot | Custom | Attached workbook |
| 384 | [Shopify](https://www.shopify.com/careers) | shopify | Custom | Attached workbook |
| 385 | [Squarespace](https://www.squarespace.com/careers) | squarespace | Greenhouse | Attached workbook |
| 386 | [Datadog](https://careers.datadoghq.com) | datadog | Greenhouse | Attached workbook |
| 387 | [MongoDB](https://www.mongodb.com/careers) | mongodb | Greenhouse | Attached workbook |
| 388 | [Elastic](https://www.elastic.co/careers) | elastic | Greenhouse | Attached workbook |
| 389 | [Confluent](https://careers.confluent.io) | confluent | Greenhouse | Attached workbook |
| 390 | [GitLab](https://about.gitlab.com/jobs) | gitlab | Greenhouse | Attached workbook |
| 391 | [GitHub](https://github.careers) | github | Custom | Attached workbook |
| 392 | [Docker](https://www.docker.com/careers) | docker | Greenhouse | Attached workbook |
| 393 | [HashiCorp](https://www.hashicorp.com/careers) | hashicorp | Greenhouse | Attached workbook |
| 394 | [Cloudflare](https://www.cloudflare.com/careers) | cloudflare | Greenhouse | Attached workbook |
| 395 | [Fastly](https://www.fastly.com/about/careers) | fastly | Greenhouse | Attached workbook |
| 396 | [Akamai](https://www.akamai.com/careers) | akamai | Workday | Attached workbook |
| 397 | [Texas Instruments](https://careers.ti.com) | texas-instruments | Custom | Attached workbook |
| 398 | [AMD](https://careers.amd.com) | amd | Workday | Attached workbook |
| 399 | [Micron](https://careers.micron.com) | micron | Custom | Attached workbook |
| 400 | [Western Digital](https://jobs.westerndigital.com) | western-digital | Workday | Attached workbook |
| 401 | [Seagate](https://www.seagate.com/careers) | seagate | Custom | Attached workbook |
| 402 | [Juniper Networks](https://careers.juniper.net) | juniper-networks | Workday | Attached workbook |
| 403 | [Arista Networks](https://www.arista.com/en/company/careers) | arista-networks | Custom | Attached workbook |
| 404 | [ARM](https://careers.arm.com) | arm | Workday | Attached workbook |
| 405 | [Red Hat](https://www.redhat.com/en/jobs) | red-hat | Workday | Attached workbook |
| 406 | [SAS Institute](https://www.sas.com/en_us/careers.html) | sas-institute | Custom | Attached workbook |
| 407 | [OpenAI](https://openai.com/careers) | openai | Ashby | Attached workbook |
| 408 | [Anthropic](https://www.anthropic.com/careers) | anthropic | Greenhouse | Attached workbook |
| 409 | [Cohere](https://cohere.com/careers) | cohere | Ashby | Attached workbook |
| 410 | [Mistral AI](https://mistral.ai/careers) | mistral-ai | Custom | Attached workbook |
| 411 | [Hugging Face](https://apply.workable.com/huggingface) | hugging-face | Workable | Attached workbook |
| 412 | [Stability AI](https://stability.ai/careers) | stability-ai | Greenhouse | Attached workbook |
| 413 | [Scale AI](https://scale.com/careers) | scale-ai | Greenhouse | Attached workbook |
| 414 | [Perplexity AI](https://www.perplexity.ai/careers) | perplexity-ai | Ashby | Attached workbook |
| 415 | [Runway](https://runwayml.com/careers) | runway | Ashby | Attached workbook |
| 416 | [Character.AI](https://character.ai/careers) | character-ai | Greenhouse | Attached workbook |
| 417 | [Inflection AI](https://inflection.ai/careers) | inflection-ai | Greenhouse | Attached workbook |
| 418 | [Adept AI](https://www.adept.ai/careers) | adept-ai | Greenhouse | Attached workbook |
| 419 | [Together AI](https://www.together.ai/careers) | together-ai | Ashby | Attached workbook |
| 420 | [Glean](https://www.glean.com/careers) | glean | Greenhouse | Attached workbook |
| 421 | [Sierra](https://sierra.ai/careers) | sierra | Ashby | Attached workbook |
| 422 | [Harvey](https://www.harvey.ai/careers) | harvey | Ashby | Attached workbook |
| 423 | [Cognition (Devin)](https://www.cognition.ai/careers) | cognition-devin | Ashby | Attached workbook |
| 424 | [Eightfold AI](https://eightfold.ai/careers) | eightfold-ai | Eightfold | Attached workbook |
| 425 | [DataRobot](https://www.datarobot.com/careers) | datarobot | Greenhouse | Attached workbook |
| 426 | [C3.ai](https://c3.ai/careers) | c3-ai | Workday | Attached workbook |
| 427 | [Stripe](https://stripe.com/jobs) | stripe | Greenhouse | Attached workbook |
| 428 | [PayPal](https://careers.pypl.com) | paypal | Custom | Attached workbook |
| 429 | [Square (Block)](https://block.xyz/careers) | square-block | Greenhouse | Attached workbook |
| 430 | [Adyen](https://careers.adyen.com) | adyen | Custom | Attached workbook |
| 431 | [Plaid](https://plaid.com/careers) | plaid | Greenhouse | Attached workbook |
| 432 | [Robinhood](https://careers.robinhood.com) | robinhood | Greenhouse | Attached workbook |
| 433 | [Coinbase](https://www.coinbase.com/careers) | coinbase | Greenhouse | Attached workbook |
| 434 | [Kraken](https://www.kraken.com/careers) | kraken | Greenhouse | Attached workbook |
| 435 | [Chime](https://www.chime.com/careers) | chime | Greenhouse | Attached workbook |
| 436 | [Affirm](https://www.affirm.com/careers) | affirm | Greenhouse | Attached workbook |
| 437 | [Klarna](https://www.klarna.com/careers) | klarna | Custom | Attached workbook |
| 438 | [Revolut](https://www.revolut.com/careers) | revolut | Custom | Attached workbook |
| 439 | [Wise](https://wise.jobs) | wise | Greenhouse | Attached workbook |
| 440 | [N26](https://n26.com/en/careers) | n26 | Custom | Attached workbook |
| 441 | [Brex](https://www.brex.com/careers) | brex | Greenhouse | Attached workbook |
| 442 | [Ramp](https://ramp.com/careers) | ramp | Ashby | Attached workbook |
| 443 | [Marqeta](https://www.marqeta.com/careers) | marqeta | Greenhouse | Attached workbook |
| 444 | [Circle](https://www.circle.com/careers) | circle | Greenhouse | Attached workbook |
| 445 | [Gemini](https://www.gemini.com/careers) | gemini | Greenhouse | Attached workbook |
| 446 | [Visa](https://corporate.visa.com/en/careers.html) | visa | Workday | Attached workbook |
| 447 | [Mastercard](https://careers.mastercard.com) | mastercard | Custom | Attached workbook |
| 448 | [American Express](https://jobs.americanexpress.com) | american-express | Custom | Attached workbook |
| 449 | [Fiserv](https://www.fiserv.com/en/about-fiserv/careers.html) | fiserv | Custom | Attached workbook |
| 450 | [FIS](https://jobs.fisglobal.com) | fis | Custom | Attached workbook |
| 451 | [Global Payments](https://www.globalpayments.com/careers) | global-payments | Workday | Attached workbook |
| 452 | [Zoho](https://www.zoho.com/careers.html) | zoho | Custom | Attached workbook |
| 453 | [Deloitte](https://jobs2.deloitte.com) | deloitte | Custom | Attached workbook |
| 454 | [PwC](https://www.pwc.com/gx/en/careers.html) | pwc | Custom | Attached workbook |
| 455 | [EY](https://careers.ey.com) | ey | Custom | Attached workbook |
| 456 | [KPMG](https://home.kpmg/xx/en/home/careers.html) | kpmg | Custom | Attached workbook |
| 457 | [Accenture](https://www.accenture.com/us-en/careers) | accenture | Custom | Attached workbook |
| 458 | [Bank of America](https://careers.bankofamerica.com) | bank-of-america | Custom | Attached workbook |
| 459 | [Citigroup](https://jobs.citi.com) | citigroup | Custom | Attached workbook |
| 460 | [Wells Fargo](https://www.wellsfargojobs.com) | wells-fargo | Custom | Attached workbook |
| 461 | [HSBC](https://www.hsbc.com/careers) | hsbc | Custom | Attached workbook |
| 462 | [UBS](https://www.ubs.com/careers) | ubs | Custom | Attached workbook |
| 463 | [Standard Chartered](https://www.sc.com/en/careers) | standard-chartered | Custom | Attached workbook |
| 464 | [BlackRock](https://careers.blackrock.com) | blackrock | Custom | Attached workbook |
| 465 | [Walmart](https://careers.walmart.com) | walmart | Custom | Attached workbook |
| 466 | [Target](https://jobs.target.com) | target | Custom | Attached workbook |
| 467 | [Costco](https://www.costco.com/careers.html) | costco | Custom | Attached workbook |
| 468 | [eBay](https://careers.ebayinc.com) | ebay | Custom | Attached workbook |
| 469 | [Etsy](https://careers.etsy.com) | etsy | Greenhouse | Attached workbook |
| 470 | [Best Buy](https://jobs.bestbuy.com) | best-buy | Custom | Attached workbook |
| 471 | [IKEA](https://jobs.ikea.com) | ikea | Custom | Attached workbook |
| 472 | [Nike](https://jobs.nike.com) | nike | Custom | Attached workbook |
| 473 | [Adidas](https://careers.adidas-group.com) | adidas | Custom | Attached workbook |
| 474 | [Starbucks](https://www.starbucks.com/careers) | starbucks | Custom | Attached workbook |
| 475 | [McDonald's](https://careers.mcdonalds.com) | mcdonald-s | Custom | Attached workbook |
| 476 | [Johnson & Johnson](https://www.careers.jnj.com) | johnson-and-johnson | Custom | Attached workbook |
| 477 | [Pfizer](https://careers.pfizer.com) | pfizer | Custom | Attached workbook |
| 478 | [Novartis](https://www.novartis.com/careers) | novartis | Custom | Attached workbook |
| 479 | [Roche](https://careers.roche.com) | roche | Custom | Attached workbook |
| 480 | [AstraZeneca](https://careers.astrazeneca.com) | astrazeneca | Custom | Attached workbook |
| 481 | [Merck](https://jobs.merck.com) | merck | Custom | Attached workbook |
| 482 | [Sanofi](https://www.sanofi.com/en/careers) | sanofi | Custom | Attached workbook |
| 483 | [GSK](https://www.gsk.com/en-gb/careers) | gsk | Custom | Attached workbook |
| 484 | [UnitedHealth Group](https://careers.unitedhealthgroup.com) | unitedhealth-group | Custom | Attached workbook |
| 485 | [CVS Health](https://jobs.cvshealth.com) | cvs-health | Custom | Attached workbook |
| 486 | [Electronic Arts](https://www.ea.com/careers) | electronic-arts | Custom | Attached workbook |
| 487 | [Activision Blizzard](https://careers.activisionblizzard.com) | activision-blizzard | Custom | Attached workbook |
| 488 | [Riot Games](https://www.riotgames.com/en/work-with-us) | riot-games | Custom | Attached workbook |
| 489 | [Epic Games](https://www.epicgames.com/site/en-US/careers) | epic-games | Greenhouse | Attached workbook |
| 490 | [Ubisoft](https://www.ubisoft.com/en-us/company/careers) | ubisoft | Custom | Attached workbook |
| 491 | [Take-Two Interactive](https://take2games.com/careers) | take-two-interactive | Custom | Attached workbook |
| 492 | [Roblox](https://corp.roblox.com/careers) | roblox | Greenhouse | Attached workbook |
| 493 | [Disney](https://jobs.disneycareers.com) | disney | Custom | Attached workbook |
| 494 | [Warner Bros. Discovery](https://careers.wbd.com) | warner-bros-discovery | Custom | Attached workbook |
| 495 | [Spotify](https://www.lifeatspotify.com) | spotify | Custom | Attached workbook |
| 496 | [Canva](https://www.lifeatcanva.com/en/jobs) | canva | Greenhouse | Attached workbook |
| 497 | [Notion](https://www.notion.so/careers) | notion | Greenhouse | Attached workbook |
| 498 | [Figma](https://www.figma.com/careers) | figma | Greenhouse | Attached workbook |
| 499 | [Airtable](https://airtable.com/careers) | airtable | Greenhouse | Attached workbook |
| 500 | [Asana](https://asana.com/jobs) | asana | Greenhouse | Attached workbook |
| 501 | [Miro](https://miro.com/careers) | miro | Greenhouse | Attached workbook |
| 502 | [Linear](https://linear.app/careers) | linear | Ashby | Attached workbook |
| 503 | [Vercel](https://vercel.com/careers) | vercel | Greenhouse | Attached workbook |
| 504 | [Retool](https://retool.com/careers) | retool | Greenhouse | Attached workbook |
| 505 | [Airbyte](https://airbyte.com/careers) | airbyte | Ashby | Attached workbook |
| 506 | [Rippling](https://www.rippling.com/careers) | rippling | Greenhouse | Attached workbook |
| 507 | [Deel](https://www.deel.com/careers) | deel | Greenhouse | Attached workbook |
| 508 | [Remote.com](https://remote.com/careers) | remote-com | Greenhouse | Attached workbook |
| 509 | [Gusto](https://gusto.com/about/careers) | gusto | Greenhouse | Attached workbook |
| 510 | [Carta](https://carta.com/careers) | carta | Greenhouse | Attached workbook |
| 511 | [Airbnb](https://careers.airbnb.com) | airbnb | Custom | Attached workbook |
| 512 | [Lyft](https://www.lyft.com/careers) | lyft | Greenhouse | Attached workbook |
| 513 | [DoorDash](https://careers.doordash.com) | doordash | Greenhouse | Attached workbook |
| 514 | [Instacart](https://instacart.careers) | instacart | Greenhouse | Attached workbook |
| 515 | [Reddit](https://redditinc.com/careers) | reddit | Greenhouse | Attached workbook |
| 516 | [Pinterest](https://www.pinterestcareers.com) | pinterest | Custom | Attached workbook |
| 517 | [Snap Inc.](https://careers.snap.com) | snap-inc | Custom | Attached workbook |
| 518 | [Discord](https://discord.com/careers) | discord | Greenhouse | Attached workbook |
| 519 | [Twitch](https://www.twitch.tv/jobs) | twitch | Custom | Attached workbook |
| 520 | [ClickUp](https://clickup.com/careers) | clickup | Greenhouse | Attached workbook |
| 521 | [Loom](https://www.loom.com/careers) | loom | Greenhouse | Attached workbook |
| 522 | [Calendly](https://careers.calendly.com) | calendly | Greenhouse | Attached workbook |
| 523 | [Webflow](https://webflow.com/careers) | webflow | Greenhouse | Attached workbook |
| 524 | [monday.com](https://monday.com/careers) | monday-com | Custom | Attached workbook |
| 525 | [Zapier](https://zapier.com/jobs) | zapier | Greenhouse | Attached workbook |
| 526 | [Segment (Twilio)](https://segment.com/careers) | segment-twilio | Greenhouse | Attached workbook |
| 527 | [Amplitude](https://amplitude.com/careers) | amplitude | Greenhouse | Attached workbook |
| 528 | [Mixpanel](https://mixpanel.com/careers) | mixpanel | Greenhouse | Attached workbook |
| 529 | [PagerDuty](https://www.pagerduty.com/careers) | pagerduty | Greenhouse | Attached workbook |
| 530 | [New Relic](https://newrelic.com/about/careers) | new-relic | Greenhouse | Attached workbook |
| 531 | [Sentry](https://sentry.io/careers) | sentry | Greenhouse | Attached workbook |
| 532 | [LaunchDarkly](https://launchdarkly.com/careers) | launchdarkly | Greenhouse | Attached workbook |

## Company directories (6)

These are discovery references, not direct job-ingestion feeds.

| # | Name and URL | Slug |
| --- | --- | --- |
| 1 | [NSE India - Company Directory](https://www.nseindia.com/companies-listing/corporate-filings-company-search) | nse-india-company-directory |
| 2 | [BSE India - Company Directory](https://www.bseindia.com/corporates/List_Scrips.aspx) | bse-india-company-directory |
| 3 | [MCA (Ministry of Corporate Affairs)](https://www.mca.gov.in) | mca |
| 4 | [Moneycontrol - Company Directory](https://www.moneycontrol.com/india/stockpricequote) | moneycontrol-company-directory |
| 5 | [Zauba Corp - Company Search](https://www.zaubacorp.com) | zauba-corp-company-search |
| 6 | [Tofler - Company Database](https://www.tofler.in) | tofler-company-database |

## ATS patterns (5)

These patterns describe supported ATS URL families; they are not companies by themselves.

| # | Name and URL | Slug | Mode |
| --- | --- | --- | --- |
| 1 | Greenhouse — `boards-api.greenhouse.io/v1/boards/{company}/jobs` | greenhouse | connector_pattern |
| 2 | Lever — `api.lever.co/v0/postings/{company}` | lever | connector_pattern |
| 3 | SmartRecruiters — `api.smartrecruiters.com/v1/companies/{company}/postings` | smartrecruiters | connector_pattern |
| 4 | Workday — `{company}.wd1.myworkdayjobs.com/wday/cxs/{company}/jobs` | workday | connector_pattern |
| 5 | [iCIMS](https://company career-site json endpoints (per-client)) | icims | connector_pattern |

## Deduplication and application handling

- Imported jobs are standardized and stored in MongoDB.
- Exact duplicates are prevented by provider/source plus external job ID.
- Cross-source duplicates are reduced using a normalized SHA-256 fingerprint and fuzzy comparison.
- External URLs are retained for provenance; the student application remains inside CampusPe.
- A failed source is isolated and does not stop synchronization of other providers or companies.

## Source-of-truth files

- `src/config/india-career-sources.json` — portals, government sources, original company careers, directories, and ATS patterns.
- `src/config/attached-career-sources.json` — additional company career pages imported from the attached workbook.
- `src/services/job-aggregation/provider-companies.service.ts` — activation, defaults, environment overrides, and permission gates.
- `JOB_AGGREGATION.md` — connector behavior, synchronization, matching, and compliance notes.

