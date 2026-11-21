import type {
  GoBagItem,
  HelplineItem,
  Incident,
  LocalizedText,
  NECity,
  SurvivalGuideSection,
} from '../types';

export const NE_MAP_CENTER: [number, number] = [26.1445, 91.7362];
export const NE_MAP_DEFAULT_ZOOM = 7;

export const LANGUAGE_LABELS: Record<'en' | 'as' | 'hi', string> = {
  en: 'English',
  as: 'অসমীয়া',
  hi: 'हिन्दी',
};

export const VERIFIED_HELPLINES: HelplineItem[] = [
  {
    number: '1070',
    shortLabel: {
      en: 'SEOC State',
      as: 'ৰাজ্যিক জৰুৰী (SEOC)',
      hi: 'राज्य आपदा (SEOC)',
    },
    fullName: {
      en: 'State Emergency Operation Centre (SEOC)',
      as: 'ৰাজ্যিক জৰুৰীকালীন কাৰ্য্যকলাপ কেন্দ্ৰ (SEOC)',
      hi: 'राज्य आपातकालीन संचालन केंद्र (SEOC)',
    },
    description: {
      en: '24x7 State disaster control room for flood, landslide, and evacuation coordination.',
      as: 'বানপানী, ভূমিস্খলন আৰু উদ্ধাৰ অভিযানৰ বাবে ২৪ ঘণ্টীয়া ৰাজ্যিক নিয়ন্ত্ৰণ কক্ষ।',
      hi: 'बाढ़, भूस्खलन और राहत-बचाव समन्वय के लिए 24x7 राज्य नियंत्रण कक्ष।',
    },
    category: 'state',
  },
  {
    number: '1079',
    shortLabel: {
      en: 'ASDMA Flood',
      as: 'ASDMA দুৰ্যোগ',
      hi: 'ASDMA आपदा',
    },
    fullName: {
      en: 'ASDMA Disaster Management Helpline',
      as: 'অসম ৰাজ্যিক দুৰ্যোগ ব্যৱস্থাপনা প্ৰাধিকৰণ (ASDMA)',
      hi: 'असम राज्य आपदा प्रबंधन हेल्पलाइन (ASDMA)',
    },
    description: {
      en: 'Assam State Disaster Management toll-free helpline for boats, relief camps, and flood warnings.',
      as: 'নাও, আশ্ৰয় শিবিৰ আৰু বান সতৰ্কবাণীৰ বাবে অসম দুৰ্যোগ ব্যৱস্থাপনা হেল্পলাইন।',
      hi: 'नाव, राहत शिविर और बाढ़ चेतावनी के लिए असम आपदा प्रबंधन टोल-फ्री हेल्पलाइन।',
    },
    category: 'disaster',
  },
  {
    number: '1077',
    shortLabel: {
      en: 'DEOC District',
      as: 'জিলা নিয়ন্ত্ৰণ (DEOC)',
      hi: 'जिला नियंत्रण (DEOC)',
    },
    fullName: {
      en: 'District Emergency Operation Centre (DEOC)',
      as: 'জিলা জৰুৰীকালীন কাৰ্য্যকলাপ কেন্দ্ৰ (DEOC)',
      hi: 'जिला आपातकालीन संचालन केंद्र (DEOC)',
    },
    description: {
      en: 'Direct district collectorate emergency desk for local road blocks and ration dispatch.',
      as: 'স্থানীয় পথ অৱৰোধ আৰু সাহাৰ্য্য বিতৰণৰ বাবে জিলা প্ৰশাসনৰ জৰুৰীকালীন কেন্দ্ৰ।',
      hi: 'स्थानीय सड़क अवरोध और राशन सहायता के लिए जिला आपातकालीन डेस्क।',
    },
    category: 'district',
  },
  {
    number: '108',
    shortLabel: {
      en: 'Ambulance',
      as: 'এম্বুলেন্স / চিকিৎসা',
      hi: 'एम्बुलेंस / चिकित्सा',
    },
    fullName: {
      en: 'Medical Emergency / Ambulance (Mrityunjoy 108)',
      as: 'চিকিৎসা জৰুৰীকালীন / মৃত্যুঞ্জয় ১০৮ এম্বুলেন্স',
      hi: 'चिकित्सा आपातकाल / 108 एम्बुलेंस सेवा',
    },
    description: {
      en: 'Free emergency ambulance, trauma response, and urgent hospital transport across NE India.',
      as: 'সমগ্ৰ উত্তৰ-পূবত বিনামূলীয়া জৰুৰীকালীন এম্বুলেন্স আৰু চিকিৎসালয়লৈ নিয়াৰ সেৱা।',
      hi: 'उत्तर-पूर्व भारत में निःशुल्क आपातकालीन एम्बुलेंस और अस्पताल परिवहन।',
    },
    category: 'medical',
  },
  {
    number: '112',
    shortLabel: {
      en: 'Police / Fire',
      as: 'আৰক্ষী / উদ্ধাৰ',
      hi: 'पुलिस / बचाव',
    },
    fullName: {
      en: 'National Integrated Emergency (Police, Fire, Rescue)',
      as: 'ৰাষ্ট্ৰীয় সংহত জৰুৰীকালীন সেৱা (আৰক্ষী, অগ্নিনিৰ্বাপক, উদ্ধাৰ)',
      hi: 'राष्ट्रीय एकीकृत आपातकालीन सेवा (पुलिस, अग्निशमन, बचाव)',
    },
    description: {
      en: 'Single national number for police, fire brigade, SDRF/NDRF rescue, and life-threatening emergencies.',
      as: 'আৰক্ষী, অগ্নিনিৰ্বাপক বাহিনী আৰু এছডিআৰএফ/এনডিআৰএফ উদ্ধাৰৰ বাবে একক ৰাষ্ট্ৰীয় নম্বৰ।',
      hi: 'पुलिस, फायर ब्रिगेड और SDRF/NDRF बचाव के लिए एकीकृत राष्ट्रीय आपातकालीन नंबर।',
    },
    category: 'national',
  },
];

export const NE_CITIES: NECity[] = [
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789 },
  { name: 'Kaziranga', state: 'Assam', lat: 26.5775, lng: 93.1711 },
  { name: 'Haflong', state: 'Assam', lat: 25.1645, lng: 93.0168 },
  { name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { name: 'Jorhat', state: 'Assam', lat: 26.7509, lng: 94.2037 },
  { name: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.912 },
  { name: 'Tezpur', state: 'Assam', lat: 26.6528, lng: 92.7926 },
  { name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { name: 'Imphal', state: 'Manipur', lat: 24.817, lng: 93.9368 },
  { name: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  { name: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  { name: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
  { name: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065 },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-silchar-flood-1',
    title: 'Barak River Overflow — Silchar Bethukandi Embankment',
    category: 'flood',
    severity: 'Critical',
    locationName: 'Silchar, Cachar',
    state: 'Assam',
    lat: 24.8333,
    lng: 92.7789,
    description:
      'Water level 1.2m above danger mark across Rangirkhari and Sonai Road. SDRF motorized boats active; avoid ground-floor electrical boards.',
    timestamp: '2026-11-20T18:10:00.000Z',
    contactNumber: '1079',
    verified: true,
  },
  {
    id: 'inc-kaziranga-flood-2',
    title: 'Brahmaputra Inundation — Kaziranga NH-715 Corridor',
    category: 'flood',
    severity: 'High',
    locationName: 'Kaziranga, Golaghat',
    state: 'Assam',
    lat: 26.5775,
    lng: 93.1711,
    description:
      'Low-lying villages near Kohora and Bagori submerged. Wildlife crossing alerts in force along NH-715; strict 20 km/h speed limit.',
    timestamp: '2026-11-20T17:45:00.000Z',
    contactNumber: '1079',
    verified: true,
  },
  {
    id: 'inc-jorhat-flood-3',
    title: 'Neamati Ghat Ferry Suspended & Riverbank Flooding',
    category: 'flood',
    severity: 'High',
    locationName: 'Jorhat (Neamati Ghat)',
    state: 'Assam',
    lat: 26.8576,
    lng: 94.2471,
    description:
      'Jorhat–Majuli ferry operations suspended due to strong river currents. Residents in Kokilamukh advised to relocate to high-ground shelters.',
    timestamp: '2026-11-20T17:15:00.000Z',
    contactNumber: '1077',
    verified: true,
  },
  {
    id: 'inc-haflong-landslide-4',
    title: 'Major Mudslide Blocking Haflong–Silchar NH-27 Stretch',
    category: 'landslide',
    severity: 'Critical',
    locationName: 'Haflong, Dima Hasao',
    state: 'Assam',
    lat: 25.1645,
    lng: 93.0168,
    description:
      'Heavy hill slope debris blocking both lanes near Jatinga–Harangajao. BRO clearance teams deployed; rail & road travelers advised to halt.',
    timestamp: '2026-11-20T18:20:00.000Z',
    contactNumber: '1070',
    verified: true,
  },
  {
    id: 'inc-shillong-landslide-5',
    title: 'Rockfall & Single-Lane Traffic on Shillong–Guwahati NH-6',
    category: 'landslide',
    severity: 'High',
    locationName: 'Umiam–Nongpoh, Ri-Bhoi / Shillong',
    state: 'Meghalaya',
    lat: 25.6542,
    lng: 91.8975,
    description:
      'Continuous hill rainfall causing loose boulders near Umiam bridge approach. Expect 45-minute delays; avoid night travel.',
    timestamp: '2026-11-20T16:50:00.000Z',
    contactNumber: '1070',
    verified: true,
  },
  {
    id: 'inc-itanagar-landslide-6',
    title: 'Slope Slippage on Itanagar–Banderdewa NH-415',
    category: 'landslide',
    severity: 'Moderate',
    locationName: 'Itanagar, Papum Pare',
    state: 'Arunachal Pradesh',
    lat: 27.0844,
    lng: 93.6053,
    description:
      'Drainage overflow and minor embankment slip near Karsingsa block. Local police regulating alternating one-way movement.',
    timestamp: '2026-11-20T15:30:00.000Z',
    contactNumber: '1077',
    verified: true,
  },
  {
    id: 'inc-guwahati-camp-7',
    title: 'Sarusajai Stadium Relief Camp & Family Shelter',
    category: 'relief_camp',
    severity: 'Safe',
    locationName: 'Guwahati, Kamrup Metro',
    state: 'Assam',
    lat: 26.1158,
    lng: 91.7586,
    description:
      'Dry elevated indoor shelter with clean drinking water, baby food, warm meals, mobile charging stations, and on-site nursing desk.',
    capacity: '600 people',
    availableBedsOrSpots: '215 spots open',
    timestamp: '2026-11-20T18:00:00.000Z',
    contactNumber: '1079',
    verified: true,
  },
  {
    id: 'inc-silchar-camp-8',
    title: 'Cachar College High-Ground Relief Shelter',
    category: 'relief_camp',
    severity: 'Safe',
    locationName: 'Silchar, Cachar',
    state: 'Assam',
    lat: 24.8224,
    lng: 92.7965,
    description:
      'Government-verified flood shelter with solar backup, ORS & essential medicines, senior-citizen ground-floor cots, and boat pickup point.',
    capacity: '450 people',
    availableBedsOrSpots: '140 spots open',
    timestamp: '2026-11-20T17:55:00.000Z',
    contactNumber: '1077',
    verified: true,
  },
  {
    id: 'inc-dibrugarh-camp-9',
    title: 'Dibrugarh Govt Boys HS School Relief Camp',
    category: 'relief_camp',
    severity: 'Safe',
    locationName: 'Dibrugarh',
    state: 'Assam',
    lat: 27.4728,
    lng: 94.912,
    description:
      'Community kitchen serving hot meals twice daily, clean sanitation blocks, water purification unit, and veterinary shelter nearby.',
    capacity: '350 people',
    availableBedsOrSpots: '185 spots open',
    timestamp: '2026-11-20T16:40:00.000Z',
    contactNumber: '1079',
    verified: true,
  },
  {
    id: 'inc-guwahati-hospital-10',
    title: 'Gauhati Medical College & Hospital (GMCH) Trauma Wing',
    category: 'hospital',
    severity: 'Safe',
    locationName: 'Bhangagarh, Guwahati',
    state: 'Assam',
    lat: 26.1544,
    lng: 91.7702,
    description:
      '24x7 Emergency & Disaster Trauma Centre, insulin/cold-chain pharmacy, snakebite antivenom stock, and 108 ambulance dispatch bay.',
    capacity: '24x7 Emergency ICU',
    availableBedsOrSpots: 'Emergency triage open',
    timestamp: '2026-11-20T18:05:00.000Z',
    contactNumber: '108',
    verified: true,
  },
  {
    id: 'inc-shillong-hospital-11',
    title: 'NEIGRIHMS Regional Emergency Hospital',
    category: 'hospital',
    severity: 'Safe',
    locationName: 'Mawdiangdiang, Shillong',
    state: 'Meghalaya',
    lat: 25.5952,
    lng: 91.9367,
    description:
      'Regional tertiary trauma hospital with 24x7 emergency surgery, blood bank, oxygen reserve, and helicopter evacuation pad.',
    capacity: '24x7 Tertiary Care',
    availableBedsOrSpots: 'Emergency triage open',
    timestamp: '2026-11-20T17:30:00.000Z',
    contactNumber: '108',
    verified: true,
  },
  {
    id: 'inc-dibrugarh-hospital-12',
    title: 'Assam Medical College & Hospital (AMCH) Emergency',
    category: 'hospital',
    severity: 'Safe',
    locationName: 'Barbari, Dibrugarh',
    state: 'Assam',
    lat: 27.4882,
    lng: 94.9412,
    description:
      'Upper Assam referral emergency wing stocked with antivenom, insulin, dialysis support, and flood-relief mobile medical teams.',
    capacity: '24x7 Referral Emergency',
    availableBedsOrSpots: 'Emergency triage open',
    timestamp: '2026-11-20T17:00:00.000Z',
    contactNumber: '108',
    verified: true,
  },
];

export const SURVIVAL_GUIDES: SurvivalGuideSection[] = [
  {
    id: 'flood',
    title: {
      en: 'Floods & Flash Floods',
      as: 'বানপানী আৰু আকস্মিক বান',
      hi: 'बाढ़ और आकस्मिक बाढ़',
    },
    subtitle: {
      en: 'Brahmaputra & Barak Valley monsoon safety actions',
      as: 'ব্ৰহ্মপুত্ৰ আৰু বৰাক উপত্যকাৰ বাৰিষাৰ সুৰক্ষা ব্যৱস্থা',
      hi: 'ब्रह्मपुत्र और बराक घाटी मानसून सुरक्षा निर्देश',
    },
    dos: [
      {
        en: 'Move elderly family members, children, and essential medicines to upper floors or higher ground immediately.',
        as: 'বয়োজ্যেষ্ঠ লোক, শিশু আৰু জৰুৰী ঔষধ লৈ তৎক্ষণাত ওখ ঠাই বা ওপৰ মহলালৈ যাওক।',
        hi: 'बुजुर्गों, बच्चों और ज़रूरी दवाइयों के साथ तुरंत ऊँची जगह या ऊपरी मंजिल पर जाएँ।',
      },
      {
        en: 'Switch off the main electrical MCB and disconnect LPG gas cylinders before water enters rooms.',
        as: 'ঘৰলৈ পানী সোমোৱাৰ আগতেই বিদ্যুৎ মেইন ছুইচ আৰু গেছ চিলিণ্ডাৰ বন্ধ কৰক।',
        hi: 'कमरे में पानी घुसने से पहले मुख्य बिजली स्विच (MCB) और गैस सिलेंडर बंद कर दें।',
      },
      {
        en: 'Drink only boiled, chlorinated, or sealed water and keep ORS packets handy to prevent water-borne illness.',
        as: 'কেৱল উতলোৱা বা বিশুদ্ধ পানী খাওক আৰু ওআৰএছ (ORS) লগত ৰাখক।',
        hi: 'केवल उबला या स्वच्छ सीलबंद पानी पिएँ और ओआरएस (ORS) साथ रखें।',
      },
      {
        en: 'Keep mobile phones charged on battery-saver mode and dial 1079 or 1070 for SDRF boat rescue.',
        as: 'ম’বাইল ফোন বেটাৰী-ছেভাৰ মোডত ৰাখক আৰু নাও উদ্ধাৰৰ বাবে ১০৭৯ বা ১০৭০ নম্বৰত কল কৰক।',
        hi: 'मोबाइल फोन बैटरी-सेवर मोड पर रखें और नाव से बचाव के लिए 1079 या 1070 पर कॉल करें।',
      },
    ],
    donts: [
      {
        en: 'Never walk, wade, or drive through fast-moving floodwater—even 15 cm of rushing water can knock an adult down.',
        as: 'খৰস্ৰোতা বানপানীৰ মাজেৰে কেতিয়াও খোজ নাকাঢ়িব বা গাড়ী নচলাব।',
        hi: 'तेज़ बहते बाढ़ के पानी में कभी न चलें और न ही वाहन चलाएँ।',
      },
      {
        en: 'Do not touch wet electrical poles, hanging wires, or submerged household appliances.',
        as: 'ভিজা বিদ্যুৎ খুঁটা, ওলমি থকা তাঁৰ বা পানীত ডুব যোৱা বৈদ্যুতিক সামগ্ৰী নুচুব।',
        hi: 'गीले बिजली के खंभों, लटकते तारों या पानी में डूबे उपकरणों को न छुएँ।',
      },
      {
        en: 'Do not enter stagnant floodwater barefoot due to hidden drains, sharp debris, and snakes.',
        as: 'খালী ভৰিৰে বদ্ধ বানপানীত নানামিব—নলা, চোকা বস্তু আৰু সাপৰ ভয় থাকে।',
        hi: 'नंगे पैर रुके हुए बाढ़ के पानी में न जाएँ—खुले नाले और सांप का खतरा हो सकता है।',
      },
    ],
  },
  {
    id: 'landslide',
    title: {
      en: 'Landslides & Hill Road Safety',
      as: 'ভূমিস্খলন আৰু পাহাৰীয়া পথৰ সুৰক্ষা',
      hi: 'भूस्खलन और पहाड़ी सड़क सुरक्षा',
    },
    subtitle: {
      en: 'Meghalaya, Dima Hasao, Arunachal, Mizoram, Nagaland & Sikkim hill zones',
      as: 'মেঘালয়, ডিমা হাছাও, অৰুণাচল, মিজোৰাম, নাগালেণ্ড আৰু ছিক্কিমৰ পাহাৰীয়া অঞ্চল',
      hi: 'मेघालय, दीमा हसाओ, अरुणाचल, मिज़ोरम, नगालैंड और सिक्किम के पहाड़ी क्षेत्र',
    },
    dos: [
      {
        en: 'Watch for early warning signs: fresh cracks in soil/walls, tilting trees, muddy spring water, or rumbling sounds.',
        as: 'সতৰ্কবাণীৰ লক্ষণ মন কৰক: মাটি/বেৰত নতুন ফাট, গছ হাউলি পৰা বা গৰ্জনৰ শব্দ।',
        hi: 'चेतावनी के संकेतों पर ध्यान दें: मिट्टी या दीवारों में दरारें, झुकते पेड़ या गड़गड़ाहट की आवाज़।',
      },
      {
        en: 'Move sideways away from the slide path to stable higher ground immediately—do not wait to pack belongings.',
        as: 'ভূমিস্খলনৰ পথৰ পৰা কাষলৈ আঁতৰি সুৰক্ষিত ঠাইলৈ যাওক—বস্তু-বাহানি গোটাবলৈ ৰৈ নাথাকিব।',
        hi: 'भूस्खलन के रास्ते से तुरंत बगल की सुरक्षित ऊँची जगह पर जाएँ—सामान समेटने में समय न गँवाएँ।',
      },
      {
        en: 'Alert neighbors, especially elderly people living alone near hill slopes, and call 1070 / 1077.',
        as: 'পাহাৰৰ দাঁতিত থকা চুবুৰীয়া আৰু বয়োজ্যেষ্ঠ লোকসকলক সতৰ্ক কৰক আৰু ১০৭০/১০৭৭-ত জনাওক।',
        hi: 'पड़ोसियों और पहाड़ी ढलान पर अकेले रहने वाले बुजुर्गों को सचेत करें और 1070 / 1077 पर कॉल करें।',
      },
    ],
    donts: [
      {
        en: 'Never park vehicles or take shelter directly below steep wet hill cuts or overhangs during heavy rain.',
        as: 'প্ৰবল বৰষুণৰ সময়ত থিয় পাহাৰৰ তলত গাড়ী নাৰাখিব বা আশ্ৰয় নল’ব।',
        hi: 'भारी बारिश में खड़ी पहाड़ी ढलान के ठीक नीचे वाहन न खड़ा करें और न ही शरण लें।',
      },
      {
        en: 'Do not cross blocked hill roads immediately after a small slide—secondary collapses often follow.',
        as: 'সৰু ভূমিস্খলনৰ পিছতেই বন্ধ পথ পাৰ হ’বলৈ চেষ্টা নকৰিব—পুনৰ মাটি খহিব পাৰে।',
        hi: 'छोटे भूस्खलन के तुरंत बाद अवरुद्ध सड़क पार न करें—दूसरा मलबा गिर सकता है।',
      },
      {
        en: 'Do not block natural hillside rainwater drains around your home.',
        as: 'ঘৰৰ চাৰিওকাষে থকা বৰষুণৰ পানী যোৱা স্বাভাৱিক নলা বন্ধ নকৰিব।',
        hi: 'अपने घर के आसपास पहाड़ी बारिश के पानी की प्राकृतिक निकासी न रोकें।',
      },
    ],
  },
  {
    id: 'earthquake',
    title: {
      en: 'Earthquakes (Seismic Zone V)',
      as: 'ভূমিকম্প (ভূকম্পন মণ্ডল ৫)',
      hi: 'भूकंप (भूकंपीय क्षेत्र V)',
    },
    subtitle: {
      en: 'All 8 North East states lie in India’s highest seismic risk zone',
      as: 'উত্তৰ-পূবৰ আঠোখন ৰাজ্যই ভাৰতৰ সৰ্বাধিক ভূমিকম্প প্ৰৱণ অঞ্চলত অৱস্থিত',
      hi: 'उत्तर-पूर्व के सभी 8 राज्य भारत के सर्वाधिक भूकंप संवेदनशील क्षेत्र में हैं',
    },
    dos: [
      {
        en: 'DROP to hands and knees, COVER your head and neck under a sturdy table, and HOLD ON until shaking stops.',
        as: 'তললৈ বহি পৰক (DROP), শক্তিশালী টেবুলৰ তলত মূৰ-ডিঙি ঢাকক (COVER), আৰু কঁপনি নৰোৱালৈকে ধৰি ৰাখক (HOLD ON)।',
        hi: 'झुकें (DROP), मज़बूत मेज़ के नीचे सिर और गर्दन ढकें (COVER), और झटके रुकने तक पकड़ें (HOLD ON)।',
      },
      {
        en: 'If outdoors, move calmly into an open ground away from buildings, boundary walls, and electric lines.',
        as: 'বাহিৰত থাকিলে অট্টালিকা, দেৱাল আৰু বিদ্যুৎ তাঁৰৰ পৰা আঁতৰি মুকলি ঠাইলৈ যাওক।',
        hi: 'यदि बाहर हैं, तो इमारतों, दीवारों और बिजली के तारों से दूर खुले मैदान में चले जाएँ।',
      },
      {
        en: 'After shaking stops, evacuate calmly via stairs, check for gas leaks, and expect aftershocks.',
        as: 'কঁপনি ৰোৱাৰ পিছত চিৰিৰে লাহে লাহে ওলাই আহক, গেছ লিক পৰীক্ষা কৰক আৰু পৰৱৰ্তী কঁপনিৰ বাবে সাজু থাকক।',
        hi: 'झटके रुकने के बाद सीढ़ियों से शांत होकर बाहर निकलें, गैस रिसाव जाँचें और आफ्टरशॉक के लिए तैयार रहें।',
      },
    ],
    donts: [
      {
        en: 'Never use elevators/lifts during or right after an earthquake.',
        as: 'ভূমিকম্পৰ সময়ত বা লগে লগে কেতিয়াও লিফ্ট ব্যৱহাৰ নকৰিব।',
        hi: 'भूकंप के दौरान या तुरंत बाद कभी भी लिफ्ट का उपयोग न करें।',
      },
      {
        en: 'Do not run down staircases or stand near glass windows while the ground is still shaking.',
        as: 'মাটি কঁপি থকা অৱস্থাত চিৰিৰে দৌৰি নানামিব বা আইনাৰ খিৰিকীৰ ওচৰত থিয় নহ’ব।',
        hi: 'झटकों के दौरान सीढ़ियों पर न भागें और काँच की खिड़कियों के पास न खड़े हों।',
      },
      {
        en: 'Do not light matches or switch on sparks if you smell cooking gas.',
        as: 'গেছৰ গোন্ধ পালে জুইশলা নজ্বলাব বা বিদ্যুৎ ছুইচ টিপি নিদিব।',
        hi: 'गैस की गंध आने पर माचिस न जलाएँ और न ही बिजली का स्विच चालू करें।',
      },
    ],
  },
];

export const GO_BAG_ITEMS: GoBagItem[] = [
  {
    id: 'water',
    category: 'water_food',
    label: {
      en: 'Drinking water (3 liters per person) & ORS packets',
      as: 'খোৱা পানী (প্ৰতিজনৰ বাবে ৩ লিটাৰ) আৰু ORS পেকেট',
      hi: 'पीने का पानी (प्रति व्यक्ति 3 लीटर) और ORS पैकेट',
    },
  },
  {
    id: 'medicines',
    category: 'medical',
    label: {
      en: '7-day essential medicines (Insulin, BP, Asthma) & First-Aid kit',
      as: '৭ দিনৰ জৰুৰী ঔষধ (ইনচুলিন, ৰক্তচাপ) আৰু প্ৰাথমিক চিকিৎসা বাকচ',
      hi: '7 दिन की ज़रूरी दवाइयाँ (इंसुलिन, बीपी, अस्थमा) और फर्स्ट-एड किट',
    },
  },
  {
    id: 'documents',
    category: 'documents',
    label: {
      en: 'Aadhaar, Voter ID, medical prescriptions in a waterproof pouch',
      as: 'ৱাটাৰপ্ৰুফ বেগত আধাৰ, ভোটাৰ কাৰ্ড আৰু ডাক্তৰৰ প্ৰেছক্ৰিপচন',
      hi: 'वाटरप्रूफ पाउच में आधार, पहचान पत्र और डॉक्टर की पर्ची',
    },
  },
  {
    id: 'torch',
    category: 'gear',
    label: {
      en: 'LED Torch / Flashlight with spare batteries & loud whistle',
      as: 'অতিৰিক্ত বেটাৰীসহ টৰ্চ লাইট আৰু জোৰকৈ বজাব পৰা হুইছেল',
      hi: 'अतिरिक्त बैटरी के साथ टॉर्च और तेज़ सीटी',
    },
  },
  {
    id: 'powerbank',
    category: 'gear',
    label: {
      en: 'Fully charged power bank, charging cable & small cash',
      as: 'সম্পূৰ্ণ চাৰ্জ থকা পাৱাৰ বেংক, কেবল আৰু নগদ টকা',
      hi: 'पूरी तरह चार्ज पावर बैंक, केबल और कुछ नकद रुपये',
    },
  },
  {
    id: 'food',
    category: 'water_food',
    label: {
      en: 'Dry ready-to-eat food (flattened rice / chira, biscuits, jaggery)',
      as: 'শুকান খাদ্য (চিৰা, বিস্কুট, গুৰ)',
      hi: 'सूखा तैयार भोजन (चिवड़ा, बिस्कुट, गुड़)',
    },
  },
  {
    id: 'rain_gear',
    category: 'gear',
    label: {
      en: 'Raincoat / plastic sheet, spare dry clothes & mosquito repellent',
      as: 'ৰেইনকোট, শুকান কাপোৰ আৰু মহ খেদা ক্ৰীম',
      hi: 'रेनकोट / प्लास्टिक शीट, सूखे कपड़े और मच्छर निरोधक',
    },
  },
  {
    id: 'contacts',
    category: 'documents',
    label: {
      en: 'Written paper card with family phone numbers & blood groups',
      as: 'পৰিয়ালৰ ফোন নম্বৰ আৰু তেজৰ গ্ৰুপ লিখা কাগজৰ কাৰ্ড',
      hi: 'परिवार के फोन नंबर और ब्लड ग्रुप लिखा हुआ कागज़ का कार्ड',
    },
  },
];

export const UI_STRINGS: Record<string, LocalizedText> = {
  helplineBarTitle: {
    en: '1-Tap Verified NE Helplines',
    as: '১-টেপ জৰুৰীকালীন হেল্পলাইন',
    hi: '1-टैप प्रमाणित आपातकालीन हेल्पलाइन',
  },
  survivalGuideHeading: {
    en: 'Pocket Survival Guide',
    as: 'পকেট জীৱনৰক্ষা নিৰ্দেশিকা',
    hi: 'पॉकेट आपदा सुरक्षा मार्गदर्शिका',
  },
  survivalGuideSub: {
    en: '100% offline-ready safety checklists for North East India.',
    as: 'উত্তৰ-পূব ভাৰতৰ বাবে ১০০% অফলাইন সুৰক্ষা নিৰ্দেশনা।',
    hi: 'उत्तर-पूर्व भारत के लिए 100% ऑफलाइन सुरक्षा निर्देश।',
  },
  dosHeading: {
    en: 'What To Do (Do’s)',
    as: 'কৰণীয় (কী কৰিব)',
    hi: 'क्या करें (Do’s)',
  },
  dontsHeading: {
    en: 'What To Avoid (Don’ts)',
    as: 'বৰ্জনীয় (কী নকৰিব)',
    hi: 'क्या न करें (Don’ts)',
  },
  goBagHeading: {
    en: 'Emergency Go-Bag Checklist',
    as: 'জৰুৰীকালীন বেগৰ তালিকা (Go-Bag)',
    hi: 'आपातकालीन गो-बैग चेकलिस्ट',
  },
  goBagSub: {
    en: 'Tap each item as you pack it. Saved automatically on this device.',
    as: 'বেগত ভৰোৱাৰ লগে লগে প্ৰতিটো বস্তুত টিক দিয়ক। এই ফোনত স্বয়ংক্ৰিয়ভাৱে সংৰক্ষিত হ’ব।',
    hi: 'जैसे-जैसे सामान रखें, टिक करें। यह आपके डिवाइस पर स्वतः सहेजा जाता है।',
  },
};
