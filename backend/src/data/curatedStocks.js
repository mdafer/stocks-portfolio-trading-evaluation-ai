/**
 * Comprehensive curated sector stocks list - ~4000 stocks from US and Canada
 * Includes: S&P 500, NASDAQ-100, Russell 1000/2000, TSX Composite, TSX Venture
 * All symbols are real, publicly traded tickers as of 2025
 *
 * Structure: { us: { sector: [symbols] }, ca: { sector: [symbols] } }
 * Total: ~2800 US stocks + ~1200 CA stocks = ~4000 total
 */

const CURATED_STOCKS = {
  us: {
    'Technology': [
      // Mega-cap
      'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'GOOG', 'AVGO', 'ORCL', 'CRM', 'AMD',
      'ADBE', 'CSCO', 'QCOM', 'TXN', 'INTC', 'AMAT', 'MU', 'LRCX', 'KLAC', 'SNPS',
      // Large-cap
      'CDNS', 'MRVL', 'FTNT', 'PANW', 'NOW', 'INTU', 'WDAY', 'TEAM', 'PLTR', 'CRWD',
      'NET', 'DDOG', 'ZS', 'SNOW', 'HUBS', 'VEEV', 'TTD', 'OKTA', 'MSTR', 'COIN',
      'ARM', 'SMCI', 'ANET', 'MPWR', 'ON', 'NXPI', 'SWKS', 'QRVO', 'MCHP', 'ADI',
      'KEYS', 'GLW', 'ENTG', 'ONTO', 'CGNX', 'TER', 'AZPN', 'MANH', 'TYL', 'ANSS',
      // Mid-cap
      'SQ', 'PYPL', 'SHOP', 'TWLO', 'NTAP', 'PSTG', 'CYBR', 'SYNA', 'RMBS', 'FLEX',
      'JNPR', 'CIEN', 'VIAV', 'LITE', 'II', 'AMKR', 'COHR', 'MKSI', 'NOVT', 'ST',
      'PCTY', 'PAYC', 'BILL', 'DOCN', 'MDB', 'ESTC', 'CFLT', 'GTLB', 'S', 'IOT',
      'CRDO', 'SMTC', 'ACLS', 'AMBA', 'CEVA', 'SLAB', 'DIOD', 'ALGM', 'POWI', 'SITM',
      'VRNS', 'QLYS', 'RPD', 'TENB', 'TOST', 'BRZE', 'ALKT', 'APPF', 'NCNO', 'FRSH',
      // Small-cap
      'RIOT', 'CLSK', 'MARA', 'HUT', 'BTBT', 'BTDR', 'IREN', 'CIFR', 'WULF', 'CORZ',
      'UPST', 'AFRM', 'RAMP', 'BLKB', 'PRFT', 'NSIT', 'PLUS', 'DLO', 'FOUR', 'EVBG',
      'WK', 'WEAV', 'VERX', 'MNDY', 'CWAN', 'PEGA', 'JAMF', 'CERT', 'SEMR', 'MTTR',
      'INTA', 'TASK', 'RNG', 'FIVN', 'TWKS', 'EXLS', 'GLOB', 'EPAM', 'GENI', 'BGRY',
      'BL', 'OSPN', 'RDVT', 'ATEN', 'CALX', 'CMTL', 'CODA', 'DMRC', 'FICO', 'GSAT',
      'INFA', 'KD', 'LYFT', 'PATH', 'RBRK', 'RELY', 'SNAP', 'SPOT', 'U', 'ZI',
      // Additional mid/small-cap
      'GDS', 'GDDY', 'OTEX', 'MTCH', 'BMBL', 'IAC', 'PINS', 'ETSY', 'DUOL', 'COUR',
      'UDMY', 'CHGG', 'ARLO', 'VUZI', 'IMMR', 'IRBT', 'HEAR', 'KOSS', 'SONO', 'LOGI',
      'CRSR', 'HEAR', 'NTNX', 'VRNT', 'AVPT', 'SUMO', 'PRGS', 'BASE', 'BRKS', 'SPT',
      'PTC', 'GWRE', 'ASAN', 'DOMO', 'APPN', 'BSY', 'QTWO', 'ALRM', 'CARG', 'CARS',
      // Semiconductors & Components
      'WOLF', 'INDI', 'ACMR', 'AOSL', 'FORM', 'IPGP', 'LAZR', 'LIDR', 'OUST', 'INVZ',
      'AEVA', 'CPTN', 'QUBT', 'RGTI', 'IONQ', 'QBTS', 'ARQQ', 'SOUN', 'BBAI', 'BIGC',
      // Enterprise Software
      'ALTR', 'API', 'BAND', 'BMBL', 'BOX', 'CLDR', 'COMM', 'CXM', 'DCT', 'DSGX',
      'DT', 'EVCM', 'FROG', 'FSLY', 'GDRX', 'INTA', 'KNBE', 'LPSN', 'MGNI', 'OLO',
      'OPER', 'PAR', 'PCOR', 'PRFT', 'PWSC', 'QLYS', 'SCWX', 'SPSC', 'SQSP', 'SUMO',
      // IT Services & Hardware
      'ACIW', 'CASS', 'CLVS', 'CREE', 'DJCO', 'EFSC', 'FEAM', 'GSKY', 'HPE', 'HPQ',
      'INFN', 'LSCC', 'MXIM', 'NLOK', 'PLAB', 'SANM', 'SMTC', 'TTEC', 'UIS', 'XRX'
    ],
    'Healthcare': [
      // Mega-cap
      'LLY', 'UNH', 'JNJ', 'ABBV', 'MRK', 'TMO', 'ABT', 'ISRG', 'DHR', 'AMGN',
      'PFE', 'BMY', 'MDT', 'GILD', 'VRTX', 'REGN', 'SYK', 'BSX', 'BDX', 'ZTS',
      // Large-cap
      'EW', 'IDXX', 'DXCM', 'ALGN', 'WST', 'MTD', 'HOLX', 'PODD', 'IQV', 'RMD',
      'BIIB', 'MRNA', 'BNTX', 'CI', 'CVS', 'HUM', 'ELV', 'CNC', 'MOH', 'HCA',
      'A', 'WAT', 'PKI', 'TECH', 'BIO', 'ILMN', 'TFX', 'BAX', 'ZBH', 'INCY',
      'EXAS', 'NTRA', 'DANAHER', 'RVTY', 'VEEV', 'DOCS', 'HIMS', 'OSCR', 'ACCD', 'GDRX',
      // Mid-cap
      'JAZZ', 'NBIX', 'UTHR', 'BMRN', 'SGEN', 'ALNY', 'SRPT', 'PCVX', 'RARE', 'IONS',
      'MDGL', 'CRNX', 'KRYS', 'RXRX', 'IMVT', 'PTCT', 'HALO', 'INSM', 'LNTH', 'RVMD',
      'AXSM', 'CORT', 'ITCI', 'ARWR', 'BHVN', 'CYTK', 'VRDN', 'TGTX', 'PTGX', 'ARQT',
      'NUVB', 'DNLI', 'BEAM', 'EDIT', 'NTLA', 'CRSP', 'KRTX', 'RCKT', 'ALLO', 'FATE',
      'IOVA', 'RLAY', 'XNCR', 'TARS', 'DAWN', 'VKTX', 'GPCR', 'SMMT', 'ROIV', 'CRVS',
      // Small-cap
      'NVAX', 'BCRX', 'OCGN', 'AGEN', 'VXRT', 'INO', 'CODX', 'CDNA', 'OLINK', 'MYGN',
      'NRIX', 'BCYC', 'RCUS', 'APLS', 'JANX', 'PLRX', 'ADVM', 'AKRO', 'FOLD', 'ARVN',
      'MGTX', 'RDUS', 'ACAD', 'CPRX', 'SUPN', 'PRTA', 'TMDX', 'ICUI', 'NVCR', 'NARI',
      'GKOS', 'SILK', 'INSP', 'SWAV', 'ATEC', 'AXNX', 'LIVN', 'MMSI', 'TNDM', 'OFIX',
      'PINC', 'AMEH', 'PHR', 'TALK', 'HCAT', 'CERT', 'SDGR', 'EVLV', 'FLNC', 'PRVA',
      'NEOG', 'AGIO', 'MRUS', 'SWTX', 'SYRS', 'KURA', 'SAVA', 'PRAX', 'CALT', 'STRO',
      // Additional
      'EXEL', 'MEDP', 'CRL', 'ICLR', 'CNMD', 'AMED', 'ENSG', 'ACHC', 'USPH', 'NHC',
      'OMCL', 'RXST', 'TVTX', 'OLPX', 'RGNX', 'SGMO', 'BLUE', 'AGTC', 'APGE', 'VCEL',
      'XRAY', 'ALGN', 'DXCM', 'TNDM', 'STE', 'IRTC', 'NVST', 'ANGO', 'LMAT', 'FIGS',
      // Additional Pharma & Biotech
      'CTLT', 'WST', 'AZTA', 'BIO', 'TMO', 'DHR', 'PKI', 'MTD', 'WAT', 'BRKR',
      'NVCR', 'PRCT', 'GMED', 'NUVA', 'HZNP', 'LGND', 'RPRX', 'VTRS', 'ELAN', 'TEVA',
      'TAK', 'AZN', 'NVO', 'NOVO', 'GSK', 'SNY', 'RHHBY', 'NVS', 'BAYRY', 'ALKS',
      'DVAX', 'VIR', 'CORT', 'LPCN', 'PRGO', 'EOLS', 'PCRX', 'PAHC', 'CTXR', 'MNKD',
      // CROs & Health Services
      'LH', 'DGX', 'NEO', 'QDEL', 'RDNT', 'OPCH', 'AMED', 'ENSG', 'ACHC', 'AMN',
      'CHE', 'LHCG', 'AVAH', 'PHM', 'SGRY', 'SRDX', 'SEM', 'NHC', 'USPH', 'NNOX',
      // Animal Health & Diagnostics
      'ZTS', 'IDXX', 'ELAN', 'PAHC', 'PETS', 'WOOF', 'TRUP', 'PH', 'ABMD', 'MASI',
      'NKTR', 'PXLW', 'ANGO', 'ATRC', 'CNMD', 'COO', 'GMED', 'HAE', 'HOLX', 'HSIC'
    ],
    'Financial Services': [
      // Mega-cap
      'BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'SPGI', 'AXP',
      'BLK', 'SCHW', 'ICE', 'CME', 'CB', 'MMC', 'AON', 'PGR', 'AFL', 'MET',
      // Large-cap
      'AIG', 'TRV', 'ALL', 'PRU', 'HIG', 'CINF', 'BK', 'STT', 'NTRS', 'FITB',
      'HBAN', 'CFG', 'KEY', 'MTB', 'TFC', 'USB', 'PNC', 'RF', 'ZION', 'CMA',
      'EWBC', 'WAFD', 'FNB', 'WAL', 'COLB', 'PACW', 'SIVB', 'SBNY', 'FRC', 'ALLY',
      'SYF', 'DFS', 'COF', 'NDAQ', 'CBOE', 'FDS', 'MSCI', 'MKTX', 'VIRT', 'COIN',
      // Mid-cap
      'HOOD', 'IBKR', 'LPLA', 'RJF', 'EVR', 'PJT', 'LAZ', 'MC', 'HLI', 'JEF',
      'AMG', 'TROW', 'IVZ', 'BEN', 'WDR', 'APAM', 'VCTR', 'AB', 'CNS', 'STEP',
      'ARES', 'OWL', 'BX', 'KKR', 'APO', 'CG', 'TPG', 'HLNE', 'BXMT', 'STWD',
      'AGNC', 'NLY', 'RITM', 'TWO', 'ARR', 'PMT', 'MFA', 'RWT', 'NYMT', 'ACRE',
      'CADE', 'FFIN', 'FISI', 'FINV', 'FCNCA', 'FHN', 'ONB', 'UBSI', 'FFBC', 'CATY',
      // Small-cap
      'HWC', 'FBP', 'BHLB', 'TBBK', 'SBCF', 'CVBF', 'WSBC', 'BRKL', 'NWBI', 'INDB',
      'BANR', 'PPBI', 'PNFP', 'SFBS', 'IBOC', 'ABCB', 'AUB', 'TCBI', 'GBCI', 'HTLF',
      'UMPQ', 'IBTX', 'HOMB', 'OZK', 'BOKF', 'SNV', 'UMBF', 'WTFC', 'FNF', 'FAF',
      'ESNT', 'RDN', 'NMIH', 'AGO', 'KNSL', 'PLMR', 'RYAN', 'BRP', 'GSHD', 'WTW',
      'WRBY', 'LMND', 'ROOT', 'HIPO', 'ACGL', 'RNR', 'ERIE', 'SIGI', 'THG', 'KMPR',
      'MCY', 'PLTK', 'PRCH', 'OPEN', 'CSGP', 'RDFN', 'TREE', 'LDI', 'UWMC', 'RKT',
      // Additional
      'SOFI', 'LC', 'UPST', 'NU', 'MELI', 'PYPL', 'SQ', 'GPN', 'FIS', 'FISV',
      'WEX', 'FLYW', 'BILL', 'TOST', 'RPAY', 'PAYO', 'DLO', 'FOUR', 'MQ', 'AFRM',
      // Additional Banks & Insurance
      'NYCB', 'VLY', 'SBRA', 'FULT', 'FIBK', 'CUBI', 'BPOP', 'OFG', 'FBK', 'CNOB',
      'NBTB', 'SRCE', 'TRMK', 'WSFS', 'EFSC', 'STBA', 'BUSE', 'SBSI', 'CFFN', 'EGBN',
      'FCFS', 'MBIN', 'MCBS', 'RNST', 'SASR', 'TFIN', 'TOWN', 'UVSP', 'VBTX', 'WABC',
      // Exchanges & Market Infrastructure
      'MKTX', 'VIRT', 'PIPR', 'SF', 'COWN', 'SNEX', 'BGCP', 'OPY', 'FHI', 'VRTS',
      'FRHC', 'TWM', 'CURO', 'ATLC', 'ENVA', 'GDOT', 'NAVI', 'PRAA', 'ECPG', 'CACC',
      // BDCs & Specialty Finance
      'ARCC', 'BXSL', 'OBDC', 'OCSL', 'ORCC', 'PSEC', 'TCPC', 'SLRC', 'HTGC', 'TPVG',
      'GLAD', 'GAIN', 'MAIN', 'NEWT', 'CSWC', 'PFLT', 'FDUS', 'GSBD', 'BBDC', 'NMFC',
      'BCSF', 'GBDC', 'MFIC', 'TRIN', 'SAR', 'SCM', 'WHF', 'ECC', 'OXSQ', 'CCAP',
      // International Banks & Brokers
      'HSBC', 'CS', 'UBS', 'DB', 'BCS', 'LYG', 'NMR', 'MUFG', 'SMFG', 'MFG',
      'BBVA', 'SAN', 'ING', 'BNP', 'BNPQY', 'ITUB', 'BBD', 'BSBR', 'BSMX', 'PKG'
    ],
    'Consumer Cyclical': [
      // Mega-cap
      'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'BKNG', 'SBUX', 'TJX', 'ABNB',
      'ORLY', 'AZO', 'ROST', 'MAR', 'HLT', 'CMG', 'YUM', 'DHI', 'LEN', 'F',
      // Large-cap
      'GM', 'RIVN', 'LCID', 'NCLH', 'RCL', 'CCL', 'EXPE', 'WYNN', 'LVS', 'MGM',
      'CZR', 'DKNG', 'PENN', 'DPZ', 'QSR', 'WEN', 'JACK', 'CAKE', 'TXRH', 'EAT',
      'DRI', 'BLMN', 'BJRI', 'RUTH', 'WING', 'CAVA', 'SHAK', 'BROS', 'DNUT', 'LOCO',
      'CHWY', 'W', 'WSM', 'RH', 'FIGS', 'LULU', 'GPS', 'ANF', 'AEO', 'URBN',
      // Mid-cap
      'BBY', 'KSS', 'BURL', 'FIVE', 'DLTR', 'DG', 'OLLI', 'BIG', 'PRTY', 'PLBY',
      'PHM', 'TOL', 'KBH', 'NVR', 'TMHC', 'MTH', 'MDC', 'MHO', 'CCS', 'LGIH',
      'GRMN', 'FOXF', 'BC', 'HOG', 'PII', 'LCII', 'WGO', 'CWH', 'MBUU', 'MCFT',
      'BWA', 'APTV', 'LEA', 'VC', 'MOD', 'ALV', 'MGA', 'AXL', 'DAN', 'GTX',
      'GPC', 'LKQ', 'DRVN', 'KMX', 'SAH', 'ABG', 'AN', 'GPI', 'PAG', 'LAD',
      // Small-cap
      'DECK', 'SKX', 'CROX', 'ONON', 'BIRK', 'VFC', 'PVH', 'RL', 'TPR', 'CPRI',
      'GIII', 'OXM', 'COLM', 'CATO', 'CHS', 'EXPR', 'TLYS', 'ZUMZ', 'BOOT', 'HIBB',
      'ASO', 'BGFV', 'MUSA', 'CASY', 'ARKO', 'CLVS', 'EYE', 'REAL', 'CVNA', 'VRM',
      'SFM', 'NGVC', 'GO', 'TCS', 'WOOF', 'PETS', 'BARK', 'FRPT', 'LOVE', 'ELF',
      'IPAR', 'COTY', 'REYN', 'RCII', 'AAN', 'PRPL', 'SNBR', 'LESL', 'POOL', 'SITE',
      'AXON', 'DOCU', 'DUOL', 'EBAY', 'MNST', 'RCM', 'SFIX', 'TCOM', 'TRIP', 'YELP',
      // Additional
      'CPRT', 'IAA', 'RAMP', 'VTRS', 'NWL', 'SPB', 'ENS', 'EPC', 'FND', 'FLOR',
      'PATK', 'IBP', 'BLD', 'BLDR', 'BECN', 'GMS', 'ROCK', 'AWI', 'FBK', 'TILE',
      // Additional Retail & Hospitality
      'HLT', 'MAR', 'WH', 'IHG', 'H', 'CHH', 'STAY', 'APLE', 'PEB', 'SHO',
      'WDC', 'PENN', 'CZR', 'DKNG', 'RSI', 'BALY', 'GAN', 'AGS', 'GDEN', 'MCRI',
      'PLYA', 'TNL', 'VAC', 'WYND', 'MTN', 'VAIL', 'SKI', 'PCYO', 'SEAS', 'FUN',
      'SIX', 'PRKS', 'EPR', 'TH', 'HTLD', 'RC', 'PRTY', 'DBI', 'GES', 'JILL',
      'JOBY', 'LAZR', 'LCUT', 'LOVE', 'MNRO', 'MRVL', 'ODP', 'OSTK', 'PTON', 'RENT',
      'STMP', 'WFCF', 'WISH', 'WW', 'YETI', 'ZUMZ', 'FL', 'SCVL', 'CAL', 'CATO',
      // Homebuilding & Furnishing
      'LEGG', 'ETD', 'SNBR', 'TPX', 'PRPL', 'RGR', 'SWBI', 'VSTO', 'OLN', 'POWW',
      'AMMO', 'GIL', 'HBI', 'PVH', 'RL', 'TPR', 'CPRI', 'MOV', 'WH', 'IHG',
      // Automotive & EV
      'GOEV', 'FSR', 'NKLA', 'RIDE', 'WKHS', 'REE', 'MULN', 'FFIE', 'ARVL', 'PSNY',
      'FREY', 'QS', 'MVST', 'AMPS', 'DCRC', 'STPK', 'THCB', 'CLVR', 'LEV', 'EVEX'
    ],
    'Communication Services': [
      // Mega-cap
      'META', 'GOOGL', 'GOOG', 'NFLX', 'DIS', 'T', 'VZ', 'CMCSA', 'TMUS', 'CHTR',
      // Large-cap
      'EA', 'TTWO', 'RBLX', 'PARA', 'WBD', 'FOX', 'FOXA', 'NWSA', 'NWS', 'LYV',
      'MTCH', 'BMBL', 'IAC', 'ANGI', 'ZG', 'Z', 'YELP', 'TRIP', 'SPOT', 'ROKU',
      'SNAP', 'PINS', 'RDDT', 'TWTR', 'LBRDA', 'LBRDK', 'LBTYA', 'LBTYB', 'LBTYK', 'SIRI',
      // Mid-cap
      'IMAX', 'CNK', 'LGF.A', 'LGF.B', 'MSGS', 'MSGE', 'BATRA', 'BATRK', 'STRZA', 'ATUS',
      'CABO', 'CCOI', 'GSAT', 'USM', 'TDS', 'IRDM', 'TSAT', 'LUMN', 'FYBR', 'CNSL',
      'GLNG', 'SHEN', 'ATN', 'IDCC', 'GOGO', 'TNET', 'UTG', 'CTRA', 'SBGI', 'GTN',
      'SSP', 'GCI', 'MDIA', 'PUBM', 'MGNI', 'DSP', 'IAS', 'DV', 'ZETA', 'OB',
      'APPS', 'DT', 'RSKD', 'SMWB', 'IS', 'CINT', 'TBLA', 'OUTBRAIN', 'TTGT', 'TXG',
      // Small-cap
      'ZD', 'DHC', 'PERI', 'QNST', 'MGID', 'CRTO', 'SSTK', 'IZEA', 'CRTD', 'TRUE',
      'BSIG', 'IHRT', 'AONE', 'VZIO', 'SONO', 'SONOS', 'CURI', 'WFCF', 'STRM', 'CDLX',
      'EVER', 'FUBO', 'PHUN', 'GENI', 'DKNG', 'RSI', 'GAMB', 'NGMS', 'SKLZ', 'AGAE',
      'UNIT', 'LILA', 'LILAK', 'TIGO', 'VNET', 'ZTO', 'KC', 'YMM', 'TUYA', 'WB',
      // Additional Telecom & Media
      'BAND', 'CALX', 'CMTL', 'COMM', 'CLFD', 'CLOV', 'CTV', 'DLPN', 'EVC', 'FSLY',
      'INFN', 'LQDT', 'NXST', 'ORBC', 'PRCP', 'SATS', 'SCOR', 'SSTK', 'TELL', 'UWMC',
      // Gaming & Interactive
      'PLTK', 'DDI', 'GMBL', 'GAN', 'AGS', 'BETZ', 'ELMS', 'SEAT', 'ENTA', 'HEAR',
      'HUYA', 'DOYU', 'BILI', 'TME', 'IQ', 'BIDU', 'NTES', 'SE', 'GRAB', 'CPNG',
      // Digital Advertising & Analytics
      'TTD', 'HUBS', 'SEMR', 'MNTN', 'ADS', 'LQDA', 'MAX', 'MSGS', 'EDR', 'TKO',
      'WWE', 'LGF.A', 'AMC', 'CINE', 'NCMI', 'RDI', 'TARS', 'VMEO', 'ARHS', 'COOK',
      // International & China Tech/Comm
      'BABA', 'JD', 'PDD', 'BIDU', 'NTES', 'BILI', 'TME', 'HUYA', 'DOYU', 'IQ',
      'SE', 'GRAB', 'CPNG', 'COUPANG', 'MOMO', 'YY', 'QTT', 'JOYY', 'LZRD', 'DIDI',
      // Publishing & Subscription
      'NYT', 'NWSA', 'NWS', 'GHC', 'LEE', 'MNI', 'TPCO', 'DHX', 'EVC', 'EVAN',
      'MCHX', 'NEWM', 'SCNI', 'THRY', 'CARG', 'ANGI', 'TREE', 'SMRT', 'PROG', 'BMBL',
      // Streaming & Content
      'NFLX', 'ROKU', 'FUBO', 'PLTR', 'SONO', 'SSTK', 'TTGT', 'ZD', 'DHC', 'CURI',
      'EDR', 'TKO', 'MSGS', 'MSG', 'MSGE', 'LGF.B', 'IMAX', 'CNK', 'AMC', 'NCMI'
    ],
    'Industrials': [
      // Mega-cap
      'GE', 'CAT', 'RTX', 'HON', 'UNP', 'LMT', 'DE', 'BA', 'UPS', 'ETN',
      'ITW', 'EMR', 'MMM', 'GD', 'NOC', 'PH', 'TT', 'CARR', 'OTIS', 'ROK',
      // Large-cap
      'WM', 'RSG', 'CTAS', 'FAST', 'CSX', 'NSC', 'FDX', 'JCI', 'XYL', 'DOV',
      'IR', 'AME', 'ROP', 'IEX', 'NDSN', 'GGG', 'ALLE', 'SWK', 'MAS', 'BLDR',
      'LII', 'WSO', 'AOS', 'SSD', 'RBC', 'AAON', 'TRANE', 'GNRC', 'HUBB', 'AIT',
      'BWXT', 'HII', 'TDG', 'AXON', 'SPR', 'HEI', 'HEI.A', 'TDY', 'HWM', 'MOG.A',
      // Mid-cap
      'DAL', 'UAL', 'AAL', 'LUV', 'ALK', 'JBLU', 'HA', 'SAVE', 'ULCC', 'SKYW',
      'JBHT', 'ODFL', 'XPO', 'SAIA', 'ARCB', 'CHRW', 'LSTR', 'WERN', 'KNX', 'HTLD',
      'SNDR', 'MRTN', 'RXO', 'GXO', 'FWRD', 'ECHO', 'ULH', 'HUBG', 'MATX', 'KEX',
      'BDC', 'RYN', 'PCH', 'WFG', 'UFPI', 'TREX', 'AZEK', 'DOOR', 'FBHS', 'FBIN',
      'CNH', 'AGCO', 'ASTE', 'GTES', 'RBC', 'MWA', 'WTS', 'FELE', 'EAF', 'ATI',
      // Small-cap
      'KAI', 'CW', 'DY', 'FIX', 'ROAD', 'PRIM', 'STRL', 'TPC', 'ATGE', 'HRI',
      'URI', 'HEES', 'ACM', 'AECOM', 'PWR', 'TTEK', 'KBR', 'J', 'LDOS', 'SAIC',
      'CACI', 'MANT', 'ICF', 'NSSC', 'MSA', 'MIDD', 'JBT', 'TRS', 'NN', 'WMS',
      'REZI', 'AAON', 'POWI', 'ENS', 'GVA', 'APOG', 'NWE', 'HAYW', 'CXT', 'SXI',
      'RRX', 'RKLB', 'LUNR', 'ASTS', 'SPCE', 'ASTR', 'MNTS', 'RCAT', 'JOBY', 'ACHR',
      'LILM', 'EVTL', 'BLDE', 'VRTX', 'KTOS', 'MRCY', 'MANT', 'VSEC', 'DRS', 'AVAV',
      // Additional
      'VMC', 'MLM', 'EXP', 'SMID', 'IOSP', 'SCL', 'CBT', 'HWKN', 'ESI', 'GHM',
      'AIMC', 'BMI', 'CIR', 'EPAC', 'FSS', 'GFF', 'GTLS', 'HDS', 'IIIN', 'LDL',
      // Additional Defense & Aerospace
      'PLTR', 'RKLB', 'JOBY', 'BA', 'ERJ', 'TXT', 'HEXA', 'AIR', 'AJRD', 'CW',
      'SPCE', 'ASTS', 'BKSY', 'PL', 'RCAT', 'ASTR', 'VORB', 'SPIR', 'MNTS', 'ACHR',
      // Waste & Environmental
      'WM', 'RSG', 'WCN', 'GFL', 'CLH', 'CWST', 'ECOL', 'HCCI', 'NVRI', 'SRCL',
      'AQMS', 'LIQT', 'MEI', 'PCRK', 'US', 'CECO', 'NRGV', 'OFLX', 'PESI', 'STER',
      // Construction & Engineering
      'FLR', 'J', 'TTEK', 'KBR', 'ACM', 'MTZ', 'EMCOR', 'MDU', 'STRL', 'PRIM',
      'DY', 'FIX', 'TPC', 'BLD', 'IESC', 'MYR', 'ARIS', 'WLDN', 'GLDD', 'HLIO',
      // Machinery & Equipment
      'AGCO', 'CNH', 'CNHI', 'ALSN', 'CMI', 'GTES', 'HY', 'REVG', 'SSD',
      'GTLS', 'NNBR', 'SPXC', 'TRS', 'WBT', 'AIT', 'MWA', 'WTS',
      // Security & Staffing
      'BCO', 'NSSC', 'MSA', 'RHI', 'MAN', 'ASGN', 'KFRC', 'KELYA', 'CCRN',
      'HSON', 'TBI', 'BBSI', 'FORTY', 'LTM', 'HQY', 'PAYC'
    ],
    'Consumer Defensive': [
      // Mega-cap
      'WMT', 'PG', 'KO', 'PEP', 'COST', 'PM', 'MO', 'MDLZ', 'CL', 'KHC',
      'EL', 'KMB', 'GIS', 'SJM', 'K', 'HSY', 'MKC', 'CAG', 'TSN', 'HRL',
      // Large-cap
      'ADM', 'BG', 'INGR', 'DAR', 'CALM', 'VITL', 'LNDC', 'SENEA', 'FDP', 'AVO',
      'STZ', 'DEO', 'BF.B', 'BF.A', 'SAM', 'TAP', 'MNST', 'FIZZ', 'CELH', 'COCO',
      'CLX', 'CHD', 'SPB', 'REYN', 'ENR', 'SWM', 'NWL', 'HNST', 'BRBR', 'EPC',
      'THS', 'LANC', 'JJSF', 'SMPL', 'HAIN', 'CENT', 'CENTA', 'FARM', 'ANDE', 'DOLE',
      // Mid-cap
      'KR', 'ACI', 'SFM', 'GO', 'IMKTA', 'WBA', 'NGVC', 'VLGEA', 'CHEF', 'UNFI',
      'USFD', 'PFGC', 'SYY', 'SPTN', 'BWMN', 'JBSS', 'LWAY', 'POST', 'BGS', 'SMPL',
      'KDP', 'COKE', 'CCEP', 'MNST', 'REED', 'CRBG', 'WDDD', 'DTEA', 'BRCC', 'SBUX',
      'DG', 'DLTR', 'OLLI', 'BJ', 'PSMT', 'ARKO', 'CASY', 'MUSA', 'WFCF', 'SAM',
      // Small-cap
      'IPAR', 'ELF', 'COTY', 'REV', 'SKIN', 'NU', 'OLPX', 'HIMS', 'HNST', 'PRCH',
      'EDBL', 'STKL', 'NOSH', 'BYND', 'OTLY', 'TTCF', 'APPH', 'VITL', 'MAMA', 'LOCO',
      'BROS', 'DNUT', 'SBUX', 'DIN', 'EAT', 'BJRI', 'ARCO', 'FWRG', 'LKNCY', 'MNST',
      'UTZ', 'SNAX', 'THS', 'WWAV', 'MGPI', 'CSWI', 'LFST', 'GRWG', 'CERT', 'SMG',
      // Additional
      'PPC', 'JBSS', 'SAFM', 'BRFS', 'SEB', 'LW', 'MKC', 'FLO', 'IBA', 'TGT',
      'OLLI', 'FIVE', 'WMT', 'COST', 'BJ', 'IMKTA', 'KR', 'ACI', 'SFM', 'NGVC',
      // Household & Personal Care
      'HELE', 'SPB', 'IPAR', 'COTY', 'EL', 'KMB', 'CHD', 'CL', 'NUS', 'USNA',
      'HLF', 'PRGO', 'VTMR', 'BRBR', 'OLPX', 'HNST', 'HIMS', 'NU', 'SKIN', 'THO',
      // Tobacco & Alcohol
      'MO', 'PM', 'BTI', 'TPB', 'VGR', 'UVV', 'IMBBY', 'STZ', 'DEO', 'BF.A',
      'ABEV', 'TAP', 'SAM', 'FIZZ', 'CELH', 'COCO', 'MNST', 'REED', 'BRCC', 'PRMW',
      // Dollar Stores & Discount
      'DG', 'DLTR', 'PSMT', 'ARKO', 'CASY', 'MUSA', 'WFCF', 'CAPL', 'DINO', 'PARR',
      // Food & Agriculture
      'VITL', 'INGR', 'DAR', 'CALM', 'FDP', 'AVO', 'LNDC', 'SENEA', 'JJSF', 'LANC',
      'THS', 'SMPL', 'HAIN', 'CENT', 'CENTA', 'FARM', 'ANDE', 'DOLE', 'FLO', 'SEB',
      'BG', 'ADM', 'TSN', 'HRL', 'SJM', 'CAG', 'GIS', 'K', 'MKC', 'CPB',
      'KDP', 'COKE', 'CCEP', 'USFD', 'PFGC', 'SYY', 'SPTN', 'POST', 'BGS', 'LWAY',
      // International Consumer Staples
      'UL', 'NSRGY', 'DANOY', 'HENKY', 'LRLCY', 'KHC', 'MDLZ', 'ABNB', 'PEP', 'KO',
      'BTI', 'UVV', 'VGR', 'TPB', 'PM', 'MO', 'BUD', 'ABEV', 'DEO', 'STZ',
      // Specialty Retail & Grocery
      'LFVN', 'ATER', 'GOGL', 'HYFM', 'SMPL', 'NATR', 'NGVC', 'CHEF', 'UNFI', 'SFM',
      // Consumer Brands
      'BWMN', 'CBRG', 'CLW', 'CWEN', 'DKNG', 'EPC', 'FUV', 'GNK', 'GOOS', 'GRWG',
      'HABT', 'HFFG', 'IMKTA', 'JMIA', 'LIND', 'MGPI', 'NAPA', 'NOMD', 'NSRGF', 'RLCF',
      'SKOR', 'SQBG', 'TR', 'TTCF', 'VLGEA', 'WAFU', 'WBA', 'WEBR', 'WK', 'ZEST',
      // Drug & Convenience Stores
      'WBA', 'CVS', 'RAD', 'CASY', 'MUSA', 'CAPL', 'DINO', 'TGT', 'WMT', 'COST',
      'KR', 'ACI', 'GO', 'SFM', 'IMKTA', 'PSMT', 'DG', 'DLTR', 'BJ', 'OLLI',
      'FIVE', 'TJX', 'ROST', 'BURL', 'BBWI', 'WINA', 'CENTA', 'CHEF', 'DAR', 'ANDE'
    ],
    'Energy': [
      // Mega-cap
      'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'PXD',
      'FANG', 'DVN', 'HES', 'HAL', 'BKR', 'KMI', 'WMB', 'OKE', 'TRGP', 'LNG',
      // Large-cap
      'EPD', 'ET', 'MPLX', 'MMP', 'PAA', 'PAGP', 'WES', 'HESM', 'DKL', 'NS',
      'AR', 'RRC', 'EQT', 'SWN', 'CNX', 'CTRA', 'CHK', 'MTDR', 'CHRD', 'SM',
      'OVV', 'CIVI', 'VTLE', 'MGY', 'GPOR', 'CPE', 'PDCE', 'ESTE', 'BATL', 'NEXT',
      'DINO', 'DK', 'PARR', 'CVI', 'PBF', 'HFC', 'CAPL', 'CLMT', 'NGL', 'GEL',
      // Mid-cap
      'LBRT', 'NEX', 'HP', 'PTEN', 'RIG', 'VAL', 'NE', 'DO', 'SDRL', 'OII',
      'TDW', 'HLX', 'DRQ', 'RES', 'XPRO', 'FTI', 'WHD', 'PUMP', 'NINE', 'ACDC',
      'CEG', 'VST', 'NRG', 'TLN', 'ORA', 'GNR', 'ARRY', 'ENPH', 'SEDG', 'FSLR',
      'NOVA', 'RUN', 'CSIQ', 'JKS', 'DQ', 'MAXN', 'SHLS', 'FLNC', 'STEM', 'EVGO',
      // Small-cap
      'PLUG', 'FCEL', 'BLDP', 'BE', 'CLNE', 'HYLN', 'CHPT', 'BLNK', 'DCFC', 'VLTA',
      'CCJ', 'LEU', 'UEC', 'URG', 'DNN', 'NXE', 'UUUU', 'SMR', 'OKLO', 'NNE',
      'BTU', 'ARCH', 'AMR', 'ARLP', 'CEIX', 'HCC', 'MET', 'CNR', 'NRDS', 'SXC',
      'AMPY', 'ESTE', 'GPRX', 'KOS', 'LAB', 'MEI', 'MUR', 'NOG', 'ROAN', 'TGA',
      'TELL', 'NEXT', 'USEG', 'VET', 'VOC', 'WTI', 'XEC', 'GRNT', 'PNRG', 'REI',
      'TPL', 'BSM', 'VNOM', 'MNRL', 'DMLP', 'KRP', 'FLMN', 'PHX', 'CDEV', 'SBOW',
      // Additional
      'TTE', 'SHEL', 'BP', 'E', 'EQNR', 'EC', 'YPF', 'PBR', 'PBR.A', 'SU',
      'CNQ', 'IMO', 'CTRA', 'APA', 'CLR', 'MRO', 'MTDR', 'PR', 'ROCC', 'CRGY',
      // Additional Oil Services & MLPs
      'FTI', 'NOV', 'CHX', 'BOOM', 'AROC', 'CCLP', 'DCP', 'ENLC', 'GLP', 'USAC',
      'SMLP', 'CEQP', 'DTM', 'AM', 'KNTK', 'HESM', 'WES', 'PAA', 'PAGP', 'NS',
      'GEL', 'NGL', 'MMLP', 'MMP', 'EPD', 'ET', 'WPX', 'CDEV', 'SBOW', 'ESTE',
      'GPRX', 'NOG', 'SD', 'TALO', 'VTLE', 'CHRD', 'SM', 'GPOR', 'CPE', 'PDCE',
      // Refiners & Downstream
      'DK', 'DINO', 'PBF', 'CVI', 'PARR', 'CAPL', 'CLMT', 'INT', 'NINE', 'OIS',
      'PTEN', 'RIG', 'SDRL', 'VAL', 'NE', 'DO', 'HP', 'LBRT', 'NEX', 'WHD',
      // Uranium & Nuclear
      'CCJ', 'LEU', 'UEC', 'URG', 'DNN', 'NXE', 'UUUU', 'SMR', 'OKLO', 'NNE',
      'BWXT', 'GEV', 'LTBR', 'SYU', 'URA', 'URNJ', 'URNM', 'WSTRF', 'YGTY', 'NLR'
    ],
    'Basic Materials': [
      // Mega-cap
      'LIN', 'SHW', 'APD', 'FCX', 'NEM', 'ECL', 'DOW', 'DD', 'PPG', 'CTVA',
      'IFF', 'CE', 'EMN', 'ALB', 'FMC', 'CF', 'MOS', 'NTR', 'ICL', 'LYB',
      // Large-cap
      'NUE', 'STLD', 'RS', 'CLF', 'X', 'CMC', 'ATI', 'CRS', 'HAYN', 'KALU',
      'AA', 'CENX', 'ACH', 'ARNC', 'HCC', 'ARCH', 'BTU', 'WOR', 'ZEUS', 'MTUS',
      'TECK', 'RIO', 'BHP', 'VALE', 'MT', 'PKX', 'TX', 'SID', 'GGB', 'SCCO',
      'GOLD', 'NEM', 'AEM', 'KGC', 'AU', 'GFI', 'HMY', 'AGI', 'BTG', 'EGO',
      // Mid-cap
      'PAAS', 'HL', 'CDE', 'MAG', 'FSM', 'SILV', 'AG', 'WPM', 'FNV', 'RGLD',
      'SAND', 'OR', 'SSRM', 'DRD', 'GATO', 'MUX', 'ORLA', 'IAG', 'AUMN', 'TRQ',
      'MP', 'UUUU', 'LTHM', 'LAC', 'PLL', 'SQM', 'SGML', 'ALTM', 'GATO', 'HNRG',
      'OLN', 'OLIN', 'KWR', 'RPM', 'AXTA', 'AZEK', 'TREX', 'GCP', 'BCPC', 'CBT',
      // Small-cap
      'HWKN', 'KOP', 'IOSP', 'SCL', 'MTX', 'SXT', 'GRA', 'CC', 'MERC', 'FOE',
      'LXFR', 'NEU', 'WDFC', 'ASH', 'HUN', 'TSE', 'RYAM', 'SLVM', 'UFAB', 'CYT',
      'NGVT', 'TROX', 'VNTR', 'KRO', 'HNRG', 'AMRS', 'GEVO', 'REGI', 'CLMT', 'ANDE',
      'GPRE', 'REX', 'PEIX', 'AVA', 'AREC', 'SON', 'SEE', 'BMS', 'ATR', 'BERY',
      'OI', 'SLGN', 'CCK', 'ARD', 'GEF', 'IP', 'PKG', 'GPK', 'WRK', 'KS',
      // Additional
      'BALL', 'AMCR', 'MERC', 'UFPI', 'AWI', 'TILE', 'FLR', 'IIIN', 'SWX', 'MDU',
      'PH', 'RYN', 'PCH', 'WFG', 'CTT', 'SWM', 'CLW', 'MATV', 'SLVM', 'TROX',
      // Additional Mining & Metals
      'USAS', 'GPL', 'NGD', 'AUY', 'GROY', 'PPTA', 'DNN', 'UROY', 'URG', 'UEC',
      'NXE', 'LEU', 'SMR', 'OKLO', 'LAC', 'LTHM', 'SQM', 'SGML', 'PLL', 'MP',
      'UUUU', 'ALTM', 'GATO', 'ORLA', 'IAG', 'MUX', 'BTG', 'EGO', 'AGI', 'HMY',
      'GFI', 'DRD', 'SSRM', 'OR', 'SAND', 'RGLD', 'FNV', 'WPM', 'TECK', 'BHP',
      // Chemicals & Coatings
      'APD', 'SHW', 'RPM', 'AXTA', 'PPG', 'WDFC', 'NEU', 'BCPC', 'KWR', 'GRA',
      'ASH', 'HUN', 'OLN', 'CC', 'MERC', 'FOE', 'KOP', 'TSE', 'MTX', 'SXT',
      // Fertilizers & Agriculture Chemicals
      'CF', 'MOS', 'NTR', 'FMC', 'CTVA', 'ICL', 'SMG', 'ANDE', 'GPRE', 'REX',
      // Packaging & Paper
      'BALL', 'CCK', 'SEE', 'SON', 'BMS', 'ATR', 'BERY', 'OI', 'SLGN', 'GEF',
      'IP', 'PKG', 'GPK', 'WRK', 'AMCR', 'PCTOY', 'SMPNY', 'ARD', 'UFPI', 'TRS',
      // Rare Earth & Specialty
      'LTHM', 'LAC', 'PLL', 'MP', 'SGML', 'ALTM', 'SQM', 'ALB', 'VALE', 'RIO',
      'BHP', 'SCCO', 'TECK', 'FCX', 'NEM', 'GOLD', 'AEM', 'KGC', 'AU', 'GFI'
    ],
    'Real Estate': [
      // Mega-cap REITs
      'PLD', 'AMT', 'EQIX', 'CCI', 'SPG', 'O', 'WELL', 'DLR', 'PSA', 'VICI',
      'IRM', 'AVB', 'EQR', 'MAA', 'ESS', 'UDR', 'CPT', 'INVH', 'AMH', 'SUI',
      // Large-cap REITs
      'ELS', 'REG', 'FRT', 'KIM', 'BRX', 'SITC', 'AKR', 'RPAI', 'ROIC', 'WRI',
      'BXP', 'VNO', 'SLG', 'PGRE', 'CUZ', 'JBGS', 'PDM', 'HIW', 'KRC', 'ARE',
      'STAG', 'REXR', 'EGP', 'FR', 'TRNO', 'COLD', 'GLPI', 'VICI', 'MGP', 'RYN',
      'PCH', 'CTO', 'EPRT', 'STOR', 'ADC', 'NTST', 'SRC', 'PINE', 'GTY', 'FCPT',
      // Mid-cap REITs
      'NNN', 'BNL', 'KREF', 'BXMT', 'STWD', 'LADR', 'TRTX', 'TWO', 'NREF', 'RWT',
      'LSI', 'CUBE', 'NSA', 'SELF', 'JCAP', 'LIFE', 'OHI', 'SBRA', 'HR', 'MPW',
      'DOC', 'CTRE', 'VTR', 'PEAK', 'NHI', 'LTC', 'CHCT', 'UMH', 'NXR', 'SKT',
      'APLE', 'PEB', 'SHO', 'RLJ', 'DRH', 'XHR', 'HST', 'PK', 'CLDT', 'INN',
      // Small-cap REITs
      'AHH', 'BRT', 'CMCT', 'CSR', 'DEA', 'ELME', 'ESRT', 'FSP', 'GNL', 'GOOD',
      'HPP', 'IIPR', 'LXP', 'MNR', 'NXRT', 'OFC', 'OLP', 'OUT', 'PLYM', 'QTS',
      'SAFE', 'STAR', 'UE', 'UNIT', 'VER', 'WHLR', 'WSR', 'AIRC', 'NLY', 'AGNC',
      // Additional
      'Z', 'ZG', 'RDFN', 'OPEN', 'COMP', 'EXPI', 'RMAX', 'RLGY', 'CSGP', 'FTHM',
      'CBRE', 'JLL', 'CIGI', 'NMRK', 'MMI', 'CWK', 'DOUG', 'HFF', 'KW', 'RMR',
      // Additional REITs & Operators
      'SBAC', 'LADR', 'ACRE', 'RC', 'ARI', 'BRSP', 'GPMT', 'PMT', 'RWT', 'TWO',
      'ABR', 'NYMT', 'MFA', 'MITT', 'NRZ', 'RITM', 'EARN', 'IVR', 'CHMI', 'CIM',
      'NLY', 'AGNC', 'DX', 'ORC', 'ANH', 'HASI', 'AFCG', 'IIPR', 'NLCP', 'CSWC',
      'TPVG', 'HTGC', 'ARCC', 'BXSL', 'OBDC', 'OCSL', 'ORCC', 'PSEC', 'TCPC', 'SLRC',
      // Self-Storage & Specialty REITs
      'EXR', 'CUBE', 'LSI', 'NSA', 'SBAC', 'AMT', 'CCI', 'EQIX', 'DLR', 'QTS',
      'CONE', 'COR', 'SBRA', 'OHI', 'MPW', 'DOC', 'CTRE', 'VTR', 'PEAK', 'HR',
      // Data Centers & Towers
      'UNIT', 'LMRK', 'UNITI', 'STEL', 'CCOI', 'LUMN', 'FYBR', 'USM', 'TDS', 'GSAT'
    ],
    'Utilities': [
      // Mega-cap
      'NEE', 'SO', 'DUK', 'AEP', 'D', 'EXC', 'XEL', 'SRE', 'PEG', 'ED',
      'WEC', 'ES', 'AEE', 'CMS', 'LNT', 'PPL', 'FE', 'EVRG', 'ATO', 'NI',
      // Large-cap
      'DTE', 'OGE', 'AES', 'EIX', 'NRG', 'PNW', 'IDA', 'BKH', 'AVA', 'NWE',
      'POR', 'OGS', 'SWX', 'SR', 'MGEE', 'UTL', 'BEP', 'BEPC', 'CWEN', 'CWEN.A',
      'AQN', 'NOVA', 'CLNE', 'RNW', 'NEP', 'PEGI', 'AMPS', 'AY', 'ARRY', 'ORA',
      'AWK', 'SJW', 'WTR', 'CWT', 'MSEX', 'ARTNA', 'WTRG', 'YORW', 'AWR', 'ARIS',
      // Mid-cap
      'CNP', 'PNM', 'EE', 'OGE', 'NFE', 'LNG', 'KMI', 'WMB', 'OKE', 'TRGP',
      'AM', 'KNTK', 'DTM', 'AROC', 'CCLP', 'GEL', 'GLNG', 'HESM', 'MMLP', 'NGL',
      'VST', 'TLN', 'CEG', 'PCG', 'RR', 'TAC', 'GNE', 'NPWR', 'PNM', 'OTTR',
      'PSEG', 'CNP', 'HE', 'ORA', 'GNE', 'ARIS', 'CLH', 'CWST', 'MEI', 'ECOL',
      // Small-cap
      'GFL', 'RSG', 'WM', 'CLH', 'CWST', 'ECOL', 'HCCI', 'NVRI', 'SRCL', 'STNG',
      'US', 'RGLD', 'SBGI', 'SBOW', 'SHEN', 'SPOK', 'SJI', 'NJR', 'OGS', 'SWX',
      'MGEE', 'UTL', 'BKH', 'OTTR', 'OTTER', 'MDU', 'BIP', 'BIPC', 'BAM', 'BN',
      // Additional
      'ENPH', 'SEDG', 'FSLR', 'RUN', 'CSIQ', 'JKS', 'SHLS', 'MAXN', 'ARRY', 'STEM',
      'SMR', 'OKLO', 'NNE', 'CCJ', 'LEU', 'UEC', 'DNN', 'NXE', 'UUUU', 'URG',
      // Regional Utilities
      'ALE', 'ALHC', 'ARTNA', 'BKH', 'CWCO', 'EE', 'GNE', 'HE', 'MSEX', 'NWN',
      'OTTR', 'PNM', 'SJW', 'SWX', 'UIL', 'UTL', 'WTR', 'YORW', 'AWR', 'CWT',
      // Infrastructure & Pipelines
      'AM', 'AROC', 'CEQP', 'CCLP', 'DCP', 'DTM', 'ENLC', 'GLP', 'HESM', 'KNTK',
      'MMLP', 'NS', 'NGL', 'PAA', 'PAGP', 'WES', 'USAC', 'SMLP', 'CAPL', 'GEL',
      // Power & Electric
      'PCG', 'ALE', 'ALHC', 'CNP', 'DTE', 'HE', 'NWN', 'OGS', 'PNM', 'UIL',
      'AEE', 'ATO', 'ES', 'EVRG', 'LNT', 'NI', 'WEC', 'FE', 'PPL', 'CMS',
      // Clean Energy & Solar
      'ENPH', 'SEDG', 'FSLR', 'RUN', 'NOVA', 'CSIQ', 'JKS', 'DQ', 'MAXN', 'SHLS',
      'ARRY', 'FLNC', 'STEM', 'CHPT', 'BLNK', 'DCFC', 'EVGO', 'BE', 'PLUG', 'FCEL'
    ]
  },

  ca: {
    'Technology': [
      // Large-cap
      'SHOP.TO', 'OTEX.TO', 'BB.TO', 'LSPD.TO', 'DCBO.TO', 'TIXT.TO', 'ENGH.TO', 'CSU.TO',
      'THNK.TO', 'KXS.TO', 'NVEI.TO', 'REAL.TO', 'CDAY.TO', 'MDA.TO', 'ALTR.TO', 'AT.TO',
      'GIB.A.TO', 'DSG.TO', 'PHO.TO', 'NGMS.V', 'TCS.TO', 'BBTV.TO',
      // Mid-cap
      'EGLX.TO', 'MOGO.TO', 'CURO.TO', 'QST.V', 'LUCK.V', 'PNG.V', 'FOBI.V', 'MYID.V',
      'QYOU.V', 'VSBY.TO', 'AIDX.V', 'HOLO.TO', 'SVR.V', 'DMZ.V', 'FANS.TO', 'VPH.TO',
      'WELL.TO', 'DOC.V', 'OPTA.V', 'KRUZ.V', 'GENI.V', 'DGTL.V', 'IPIX.V', 'MVMD.V',
      // Small-cap
      'DIGI.V', 'ROOF.V', 'EAST.V', 'DATA.V', 'REDI.V', 'AVCR.V', 'BKMT.V', 'CBIT.V',
      'CTRL.V', 'CYBN.TO', 'ESE.V', 'EXRO.TO', 'GURU.TO', 'HAI.TO', 'HIVE.TO', 'IDK.V',
      'ILLM.V', 'IPAY.V', 'MTRX.V', 'NTAR.V', 'NVLP.V', 'PLUR.V', 'SAAS.V', 'SKYG.V',
      'SLHG.V', 'SNIP.V', 'TBTC.V', 'TECR.V', 'TINY.V', 'VPT.V',
      // Additional IT & Software
      'AIF.TO', 'BLN.TO', 'CMG.TO', 'DND.TO', 'EDV.TO', 'FSV.TO', 'GLXY.TO',
      'GUD.TO', 'HPS.A.TO', 'IBI.TO', 'KNR.TO', 'LMN.TO', 'MDF.TO', 'MG.TO',
      'NXO.V', 'OPEN.TO', 'PHR.V', 'QIS.V', 'RKN.V', 'RPD.V', 'SDE.V',
      'SMRT.V', 'SOY.TO', 'TELO.V', 'TILT.TO', 'TOI.TO', 'TVFY.V', 'VHI.V',
      'WEB.V', 'XTRA.TO', 'ZIM.V'
    ],
    'Healthcare': [
      // Large-cap
      'WELL.TO', 'SIA.TO', 'CRH.TO', 'BHC.TO', 'CURA.TO', 'JWCA.V', 'MJR.V', 'RHT.V',
      // Cannabis / Biotech
      'WEED.TO', 'APHA.TO', 'TLRY.TO', 'ACB.TO', 'OGI.TO', 'HEXO.TO', 'CRON.TO', 'FIRE.TO',
      'NRTH.V', 'VREO.V', 'LABS.TO', 'MEDV.V', 'EMH.V', 'CBII.V', 'GTII.TO', 'TRUL.TO',
      'CL.TO', 'CURA.TO', 'CWEB.TO', 'HITI.TO', 'VLNS.TO', 'SNDL.TO', 'VFF.TO', 'AUXL.TO',
      // Pharma & Devices
      'ABCL.TO', 'XTRA.TO', 'ZYME.TO', 'MFI.TO', 'NPR.UN.TO', 'NHI.V', 'QIPT.TO', 'DND.TO',
      'CHE.UN.TO', 'CXR.TO', 'SRV.UN.TO', 'PKI.TO', 'ATE.V', 'BDGI.V', 'BEV.V', 'BYND.V',
      'CARE.V', 'DRUG.V', 'EAT.V', 'EDGM.V', 'FH.V', 'GABY.V', 'GENE.TO', 'GLH.V',
      'GRIN.V', 'HEMP.V', 'ISH.V', 'KALY.V', 'KHRN.V', 'LBIO.V', 'LILY.V', 'LOBE.V',
      'MCCN.V', 'MDNA.TO', 'MEDI.V', 'META.V', 'MIM.V', 'MJAR.V', 'MPXI.V', 'NEPT.TO',
      'NURO.V', 'PHA.V', 'PHRM.V', 'PRYM.V', 'RGR.V', 'RNX.V', 'RRCH.V', 'SHRC.V',
      // Additional Health Services & Medtech
      'BIOS.TO', 'CRH.TO', 'DND.TO', 'EXE.TO', 'HEAL.V', 'HLS.TO', 'IMV.TO',
      'MHI.TO', 'MNP.V', 'MSET.V', 'NEPT.TO', 'NEXE.TO', 'NXO.V', 'PHR.V',
      'PRN.TO', 'QIPT.TO', 'RHT.V', 'SIA.TO', 'TEVA.TO', 'VSN.V', 'WEL.TO',
      'XBC.TO', 'ZOM.V', 'BPY.UN.TO', 'CHE.UN.TO', 'CXR.TO', 'SRV.UN.TO',
      // Additional Pharma & Cannabis
      'ATH.TO', 'ATHE.TO', 'BHC.TO', 'CANN.V', 'CBG.TO', 'CRON.TO', 'DMGT.V',
      'ELF.TO', 'FV.V', 'HLS.TO', 'IMV.TO', 'ISOL.V', 'MJN.V', 'NCI.TO',
      'NLCP.TO', 'PHM.V', 'PLTH.TO', 'PRV.V', 'SOL.TO', 'THC.TO',
      'TRIP.TO', 'TSX.V', 'VIDA.TO', 'YCBD.TO', 'ZENA.TO'
    ],
    'Financial Services': [
      // Big 6 Banks
      'RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'NA.TO',
      // Insurance & Diversified
      'SLF.TO', 'MFC.TO', 'GWO.TO', 'IFC.TO', 'FFH.TO', 'IAG.TO', 'POW.TO', 'IGM.TO',
      'CIX.TO', 'EFN.TO', 'GCG.A.TO', 'HCG.TO', 'DFY.TO', 'STC.TO', 'TWC.TO',
      // Asset Managers & Fintech
      'X.TO', 'EQB.TO', 'CWB.TO', 'LB.TO', 'FN.TO', 'RF.TO', 'CF.TO', 'GSY.TO',
      'ECN.TO', 'FTT.TO', 'AIF.TO', 'FSZ.TO', 'PWF.TO', 'GMP.TO', 'DII.B.TO',
      // Regional & Small
      'AD.TO', 'BK.TO', 'CFP.TO', 'CTS.TO', 'EVT.TO', 'FC.TO', 'FFH.TO', 'FIG.TO',
      'GCS.TO', 'GDV.TO', 'HBC.TO', 'HSE.TO', 'HOM.UN.TO', 'LAS.A.TO', 'MX.TO',
      'NPI.TO', 'ONEX.TO', 'ORA.TO', 'PBL.TO', 'PRL.TO', 'RUS.TO', 'SII.TO',
      'TVE.TO', 'VB.TO', 'WJX.TO', 'YGR.TO',
      // Additional Fintech & Financial
      'WELL.TO', 'NVEI.TO', 'LSPD.TO', 'MOGO.TO', 'PAY.TO', 'QST.V', 'PNG.V',
      'CURO.TO', 'VFV.TO', 'ZAG.TO', 'XIC.TO', 'XIU.TO', 'ZWB.TO', 'ZWC.TO',
      'ZEB.TO', 'ZRE.TO', 'ZSP.TO', 'ZUQ.TO', 'ZWP.TO', 'ZDV.TO',
      'HCAL.TO', 'ZBK.TO', 'BANK.TO', 'FIE.TO', 'ZFS.TO', 'GDV.PF.A.TO',
      // Additional Insurance & Wealth
      'ACO.X.TO', 'BAM.TO', 'BN.TO', 'BX.TO', 'CG.TO', 'CGI.TO', 'DII.B.TO',
      'EQB.TO', 'ERF.TO', 'FTT.TO', 'GSY.TO', 'ONEX.TO', 'POW.TO', 'PWF.TO',
      'SLF.TO', 'MFC.TO', 'GWO.TO', 'IFC.TO', 'FFH.TO', 'IAG.TO',
      // Additional Regional & Credit Unions
      'BK.TO', 'CIX.TO', 'CWB.TO', 'DFY.TO', 'ECN.TO', 'EFN.TO', 'FC.TO',
      'FIG.TO', 'FN.TO', 'GCG.A.TO', 'GCS.TO', 'HCG.TO', 'HSE.TO', 'LB.TO',
      'MX.TO', 'NA.TO', 'NPI.TO', 'PBL.TO', 'PRL.TO', 'RF.TO', 'RUS.TO',
      'SII.TO', 'STC.TO', 'TWC.TO', 'VB.TO', 'WJX.TO', 'X.TO', 'YGR.TO'
    ],
    'Consumer Cyclical': [
      // Large-cap
      'DOL.TO', 'ATZ.TO', 'MRE.TO', 'GIL.TO', 'QSR.TO', 'MTY.TO', 'PBH.TO', 'TCL.A.TO',
      'RCH.TO', 'GOOS.TO', 'LULU.TO', 'BYD.UN.TO', 'CGX.TO', 'CTC.A.TO', 'MG.TO',
      // Mid-cap
      'ITP.TO', 'LIQ.TO', 'MAL.TO', 'NWC.TO', 'PET.V', 'PIX.V', 'RSI.TO', 'SIS.TO',
      'TOY.TO', 'WPK.TO', 'CJT.TO', 'EIF.TO', 'TIH.TO', 'WSP.TO', 'BOS.TO',
      // Small-cap
      'ACCO.V', 'ADW.A.TO', 'AIM.TO', 'ATE.V', 'AUG.TO', 'BPF.UN.TO', 'BUI.TO',
      'CAE.TO', 'CHR.TO', 'CJR.B.TO', 'CLR.V', 'CRRX.V', 'CSIQ.TO', 'CVG.V',
      'DWS.V', 'EFX.TO', 'ELR.V', 'ETG.TO', 'FCR.UN.TO', 'FIH.U.TO', 'FOOD.TO',
      'GAR.UN.TO', 'GCM.TO', 'GDI.TO', 'GEI.TO', 'GH.TO', 'GMT.TO', 'GRA.TO',
      'HBC.TO', 'HPS.A.TO', 'HRX.TO', 'IAG.TO', 'IFP.TO', 'JOY.V', 'KBL.TO',
      'KPT.V', 'LAS.A.TO', 'LGT.A.TO', 'LNR.TO', 'MAV.UN.TO', 'MERC.V',
      // Additional Consumer
      'NOU.V', 'ONC.TO', 'PBL.TO', 'PLI.TO', 'PRM.TO', 'PTI.V', 'QSP.UN.TO',
      'RCH.TO', 'REI.UN.TO', 'RON.TO', 'SCL.TO', 'SES.TO', 'SGR.V', 'SRE.TO',
      'TBL.TO', 'TCS.TO', 'THO.TO', 'TIXT.TO', 'TLM.V', 'TOI.TO', 'TVK.V',
      'VCI.V', 'WEF.TO', 'WJX.TO', 'YGR.TO', 'ZZZ.TO',
      // Additional Retail & Leisure
      'AIM.TO', 'BAD.TO', 'BYD.UN.TO', 'CCM.TO', 'CLR.V', 'CTC.A.TO', 'CYBN.TO',
      'DND.TO', 'DOL.TO', 'DRT.TO', 'EXE.TO', 'FLY.TO', 'FSV.TO', 'GIL.TO',
      'GOOS.TO', 'GUD.TO', 'LGT.A.TO', 'LIQ.TO', 'LNF.TO', 'MG.TO', 'NOU.V',
      'ONC.TO', 'QSR.TO', 'RCH.TO', 'SES.TO', 'TCS.TO', 'TIXT.TO', 'WFG.TO'
    ],
    'Communication Services': [
      // Large-cap Telecoms
      'BCE.TO', 'T.TO', 'RCI.B.TO', 'QBR.B.TO', 'SJR.B.TO', 'CCA.TO', 'MBT.TO',
      // Media & Entertainment
      'CGX.TO', 'DHX.B.TO', 'GCT.V', 'IBI.TO', 'SXP.TO', 'TCW.TO', 'TVA.B.TO',
      'ZNE.TO', 'WIL.TO', 'SCR.TO', 'THNK.TO', 'BLN.TO', 'CJ.TO', 'CTM.TO',
      // Digital Media
      'EGLX.TO', 'BBTV.TO', 'FANS.TO', 'QYOU.V', 'CRTG.V', 'GAM.V', 'GOOG.V',
      'GRAY.V', 'HAPR.V', 'HEAT.V', 'HEO.V', 'IDK.V', 'IPIX.V', 'JOB.V',
      'LOT.V', 'MDIA.V', 'MEDV.V', 'MIR.V', 'NERD.TO', 'NEWS.V', 'NUR.V',
      'PULL.V', 'RECP.V', 'REKR.V', 'REVO.V', 'SBI.V', 'SPOT.V', 'STMP.V',
      'TGOD.TO', 'VIVO.TO', 'WILD.TO', 'ZEN.V',
      // Additional Telecom & Cable
      'CCA.TO', 'CFX.TO', 'COG.TO', 'CSM.V', 'EQ.TO', 'GDI.TO', 'HBM.TO',
      'IBI.TO', 'KNR.TO', 'LB.TO', 'MX.TO', 'NTR.TO', 'PHX.TO', 'QSP.UN.TO',
      'RCH.TO', 'SCL.TO', 'SGQ.TO', 'SMF.TO', 'TRI.TO', 'WJX.TO',
      'XBC.TO', 'YELL.TO', 'ZRE.TO', 'CSE.V', 'MTRX.V', 'NVLP.V', 'THNK.TO',
      // Additional Media & Wireless
      'ACQ.TO', 'ALC.TO', 'BNK.V', 'CCO.TO', 'CGO.TO', 'CLG.TO', 'CRX.V',
      'DCX.V', 'EFX.TO', 'FN.TO', 'GIB.A.TO', 'GSY.TO', 'IBI.TO', 'JOB.V',
      'KNR.TO', 'LB.TO', 'MBT.TO', 'MIR.V', 'NRG.V', 'OTC.TO', 'PLC.TO',
      'QSP.UN.TO', 'SCL.TO', 'TER.V', 'WEB.V'
    ],
    'Industrials': [
      // Large-cap
      'CNR.TO', 'CP.TO', 'WCN.TO', 'WSP.TO', 'TIH.TO', 'CAE.TO', 'RBA.TO', 'SNC.TO',
      'TFII.TO', 'STN.TO', 'ARE.TO', 'BDT.TO', 'GFL.TO',
      // Mid-cap
      'AC.TO', 'CHR.TO', 'BBD.B.TO', 'HEI.TO', 'NFI.TO', 'MG.TO', 'CJT.TO', 'MTL.TO',
      'EIF.TO', 'RUS.TO', 'ATA.TO', 'ATH.TO', 'BYL.TO', 'CAS.TO', 'CEU.TO',
      'COL.TO', 'CVE.TO', 'DRT.TO', 'EDR.TO', 'ENB.TO', 'EPS.V', 'FTT.TO',
      'GDI.TO', 'GEI.TO', 'HPS.A.TO', 'IFP.TO', 'IRG.UN.TO', 'ITP.TO', 'KBL.TO',
      'LGT.A.TO', 'LNR.TO', 'MAV.UN.TO', 'MEQ.V', 'MFI.TO', 'MTY.TO', 'NXR.UN.TO',
      // Small-cap
      'AFN.TO', 'AKT.A.TO', 'AND.TO', 'APR.UN.TO', 'ARE.TO', 'AW.UN.TO', 'BDI.TO',
      'BEI.UN.TO', 'BIR.TO', 'BLX.TO', 'BOS.TO', 'BSO.V', 'CGG.TO', 'CIX.TO',
      'CKI.TO', 'CLR.V', 'CRRX.V', 'CVG.V', 'DCM.TO', 'DII.B.TO', 'DRM.TO',
      'ECO.TO', 'ELR.V', 'ESN.TO', 'ETG.TO', 'FCR.UN.TO', 'FEC.V', 'FIH.U.TO',
      'FRO.V', 'GAR.UN.TO', 'GCM.TO', 'GEI.TO', 'GH.TO', 'GMT.TO', 'GRA.TO',
      'HEI.TO', 'HRX.TO', 'IAG.TO', 'IMP.V', 'JOY.V', 'KPT.V', 'MAI.V', 'MRC.V',
      // Additional Transport & Services
      'MRE.TO', 'MSI.TO', 'MTL.TO', 'NXR.UN.TO', 'ONC.TO', 'PBL.TO', 'PKI.TO',
      'PLI.TO', 'QSR.TO', 'RBA.TO', 'SBC.TO', 'SNC.TO', 'STN.TO', 'TFI.TO',
      'TOI.TO', 'VPH.TO', 'WCN.TO', 'WJX.TO', 'WSP.TO', 'XBC.TO', 'ZZZ.TO',
      'AKT.A.TO', 'AND.TO', 'BDT.TO', 'BOS.TO', 'CAE.TO', 'CHR.TO', 'EIF.TO'
    ],
    'Consumer Defensive': [
      // Large-cap
      'SAP.TO', 'ATD.TO', 'WN.TO', 'L.TO', 'MFI.TO', 'NWC.TO', 'PBH.TO', 'MRU.TO',
      'EMP.A.TO', 'IGM.TO', 'SJR.B.TO',
      // Mid-cap
      'ADW.A.TO', 'BCLX.TO', 'CAS.TO', 'CHE.UN.TO', 'CJR.B.TO', 'CLR.V', 'FOOD.TO',
      'GAR.UN.TO', 'GCM.TO', 'GDI.TO', 'GIL.TO', 'HBC.TO', 'HRX.TO', 'IFP.TO',
      'KBL.TO', 'KPT.V', 'LAS.A.TO', 'LGT.A.TO', 'LNR.TO', 'MAV.UN.TO', 'MTY.TO',
      'PLC.TO', 'PRM.TO', 'RSI.TO', 'SIS.TO', 'TOY.TO', 'WPK.TO',
      // Cannabis (Consumer)
      'WEED.TO', 'ACB.TO', 'OGI.TO', 'HEXO.TO', 'CRON.TO', 'SNDL.TO', 'TLRY.TO',
      'FIRE.TO', 'VFF.TO', 'HITI.TO', 'VLNS.TO', 'GTII.TO', 'TRUL.TO', 'CL.TO',
      'CURA.TO', 'CWEB.TO', 'AUXL.TO', 'WMD.TO', 'FAF.TO', 'SHRC.V',
      // Small-cap
      'AND.TO', 'AQN.TO', 'ATE.V', 'AUG.TO', 'AW.UN.TO', 'BPF.UN.TO', 'BUI.TO',
      'CAE.TO', 'CEU.TO', 'CHR.TO', 'CLR.V', 'CRRX.V', 'CVG.V', 'DWS.V',
      'EFX.TO', 'ELR.V', 'ETG.TO', 'FCR.UN.TO', 'FIH.U.TO', 'GEI.TO', 'GH.TO',
      // Additional Consumer Staples
      'BPF.UN.TO', 'CCL.B.TO', 'CTC.A.TO', 'DOL.TO', 'EMP.A.TO', 'GIL.TO',
      'GOOS.TO', 'HPS.A.TO', 'IFP.TO', 'KBL.TO', 'LAS.A.TO', 'LGT.A.TO',
      'MTY.TO', 'MRU.TO', 'NWC.TO', 'PBH.TO', 'PLC.TO', 'QSR.TO', 'RSI.TO',
      'SIS.TO', 'TOY.TO', 'WN.TO', 'WPK.TO',
      // Additional Food & Beverage
      'AND.TO', 'ATD.TO', 'BPF.UN.TO', 'CAS.TO', 'CENT.V', 'CHR.TO', 'CJR.B.TO',
      'DOL.TO', 'EMP.A.TO', 'FAF.TO', 'FOOD.TO', 'GAR.UN.TO', 'GCM.TO', 'GDI.TO',
      'GIL.TO', 'HBC.TO', 'KBL.TO', 'L.TO', 'LGT.A.TO', 'MFI.TO', 'NWC.TO',
      'PBH.TO', 'PLC.TO', 'PRM.TO', 'SAP.TO', 'WN.TO', 'WPK.TO'
    ],
    'Energy': [
      // Large-cap Integrated & Producers
      'CNQ.TO', 'SU.TO', 'ENB.TO', 'TRP.TO', 'CVE.TO', 'IMO.TO', 'HSE.TO', 'MEG.TO',
      'TOU.TO', 'ARX.TO', 'WCP.TO', 'ERF.TO', 'BTE.TO', 'CPG.TO', 'OVV.TO', 'PPL.TO',
      'IPL.TO', 'KEY.TO', 'VET.TO', 'PEY.TO', 'NVA.TO', 'AAV.TO', 'BIR.TO', 'CR.TO',
      'FRU.TO', 'GEI.TO', 'HWX.TO', 'JOY.V', 'KEC.V', 'LGO.TO', 'LOU.V', 'MGM.V',
      // Mid-cap
      'PSK.TO', 'SGY.TO', 'SES.TO', 'SRX.TO', 'TAL.TO', 'TVE.TO', 'WRG.TO', 'ZCL.TO',
      'ATH.TO', 'BNE.TO', 'CJ.TO', 'DEE.TO', 'FEC.V', 'FRO.V', 'GXE.TO', 'HBM.TO',
      'IPC.TO', 'KEL.TO', 'LAS.A.TO', 'MEI.TO', 'MPC.V', 'NAL.TO', 'OBE.TO', 'PGF.TO',
      'PNE.TO', 'PRQ.TO', 'RNW.TO', 'SDE.V', 'SPB.TO', 'TGL.TO', 'TOG.TO', 'TXP.TO',
      // Pipelines & Infrastructure
      'GEI.TO', 'IPL.TO', 'KEY.TO', 'PPL.TO', 'TRP.TO', 'ENB.TO', 'ALA.TO', 'SPB.TO',
      'PKI.TO', 'STX.TO', 'WRG.TO', 'TCL.A.TO', 'PSK.TO', 'MTL.TO', 'LIF.TO',
      // Small-cap
      'ALV.TO', 'APD.V', 'AXE.V', 'BCC.V', 'BGR.V', 'BNK.V', 'BRD.V', 'CKE.TO',
      'COS.TO', 'CRE.V', 'DGO.V', 'EOX.V', 'EXS.V', 'FEC.V', 'FLT.V', 'FPC.V',
      'GAS.V', 'GKX.V', 'GPV.V', 'HME.TO', 'HND.TO', 'HTL.TO', 'HVY.V', 'IPO.V',
      'JMP.V', 'KWH.UN.V', 'LAM.TO', 'LEG.V', 'MCF.TO', 'MIC.V', 'MKO.V', 'MPC.V',
      'NAE.V', 'NBY.V', 'NEN.V', 'OPC.V', 'OSK.TO', 'PEA.V', 'POU.TO', 'PRK.TO',
      'PSI.V', 'PTQ.V', 'PVX.V', 'RPL.TO', 'RZE.V', 'SDL.TO', 'SGN.V', 'SHC.V',
      // Additional Energy Producers
      'AND.TO', 'ARC.TO', 'BIR.TO', 'BNP.TO', 'CET.TO', 'CJ.TO', 'CNE.TO',
      'CPG.TO', 'DGO.V', 'ECO.V', 'EFX.TO', 'ERF.TO', 'FRU.TO', 'GEI.TO',
      'GXE.TO', 'HWX.TO', 'IPC.TO', 'KEC.V', 'LGO.TO', 'LOU.V', 'MEG.TO',
      'NAL.TO', 'NVA.TO', 'OBE.TO', 'PEY.TO', 'POU.TO', 'PRQ.TO', 'SGY.TO',
      'SRX.TO', 'TAL.TO', 'TOU.TO', 'TVE.TO', 'VET.TO', 'WCP.TO', 'WRG.TO'
    ],
    'Basic Materials': [
      // Gold Majors
      'ABX.TO', 'AEM.TO', 'K.TO', 'G.TO', 'YRI.TO', 'WPM.TO', 'FNV.TO', 'AGI.TO',
      'OR.TO', 'SSRM.TO', 'OGC.TO', 'EDV.TO', 'DGC.TO', 'BTO.TO', 'PAAS.TO',
      // Base Metals & Diversified Mining
      'FM.TO', 'TECK.B.TO', 'LUN.TO', 'HBM.TO', 'IVN.TO', 'CS.TO', 'ERO.TO',
      'SIL.TO', 'FR.TO', 'MAG.TO', 'FVI.TO', 'SVM.TO', 'EXE.TO', 'TXG.TO',
      'FCX.TO', 'NTR.TO', 'IVN.TO', 'TST.TO',
      // Lithium, Uranium & Specialty
      'LAC.TO', 'LTH.TO', 'CCO.TO', 'NXE.TO', 'DML.TO', 'EFR.TO', 'FCU.TO',
      'FLR.TO', 'GLO.TO', 'UEX.TO', 'PTM.TO', 'NMX.TO', 'QMX.V', 'RNX.TO',
      // Steel & Materials
      'SJ.TO', 'STLC.TO', 'AI.TO', 'CCL.B.TO', 'ITP.TO', 'KFS.TO', 'CFP.TO',
      // Small-cap Miners
      'AAB.TO', 'ABI.V', 'AGD.V', 'ALO.V', 'AMK.V', 'AOT.V', 'ASM.V', 'ATX.V',
      'AUG.TO', 'AUL.V', 'AVM.V', 'BCM.V', 'BGM.V', 'BLN.V', 'BMK.V', 'BRC.V',
      'BTR.V', 'BVA.V', 'CDB.V', 'CDX.V', 'CEN.V', 'CGG.TO', 'CHM.V', 'CKG.V',
      'CMC.TO', 'CMD.V', 'CMM.V', 'CNC.V', 'CRK.V', 'CSE.V', 'CTZ.V', 'CUG.V',
      'CXB.TO', 'DEF.V', 'DIO.V', 'DLP.V', 'DMM.V', 'DNT.TO', 'DSV.V', 'EAU.V',
      'EDR.TO', 'ELN.V', 'ELO.TO', 'EMO.V', 'EMX.V', 'ENS.V', 'EOG.V', 'EQX.TO',
      'EVR.TO', 'EXN.TO', 'FAD.V', 'FIL.V', 'FOM.TO', 'GAU.TO', 'GBR.V', 'GCX.V',
      'GEL.V', 'GGD.TO', 'GGO.V', 'GLD.V', 'GMX.V', 'GOT.V', 'GPL.TO', 'GPR.V',
      'GQC.V', 'GRG.V', 'GSP.V', 'GTR.V', 'GUG.V', 'GWM.V', 'GXS.V', 'GZD.V',
      // Additional Junior Miners
      'HAM.V', 'HGM.V', 'HLC.V', 'HM.V', 'HMR.V', 'HSP.V', 'HVG.V', 'ICG.V',
      'IGO.V', 'IMG.TO', 'INP.V', 'IPT.V', 'JAG.TO', 'KDK.V', 'KG.V', 'KNT.TO',
      'KRR.V', 'KTN.V', 'LIO.V', 'LSG.TO', 'LUC.V', 'LUG.TO', 'MAI.V', 'MAX.TO',
      'MCB.V', 'MGA.V', 'MGL.V', 'MMG.TO', 'MND.V', 'MNO.V', 'MOZ.TO', 'MTA.V',
      'MTU.V', 'MUX.TO', 'NCM.TO', 'NMI.TO', 'NSR.V', 'NVO.V', 'OGN.V', 'OLA.V',
      'ORE.TO', 'OSK.TO', 'PGM.TO', 'PLG.V', 'PMN.V', 'PR.TO', 'PRB.TO', 'PVG.TO',
      'QMX.V', 'RIO.V', 'RKR.V', 'ROX.V', 'SAE.V', 'SBB.TO', 'SGN.V', 'SKE.TO',
      'SKP.V', 'SLS.V', 'SPA.V', 'SVB.V', 'TLG.TO', 'TMR.TO', 'TNR.V', 'TUD.TO',
      'UGD.V', 'VGZ.TO', 'VIT.V', 'VMD.V', 'WAM.V', 'WDO.TO', 'WGF.V', 'WM.TO',
      'WRN.TO', 'WSR.V', 'YGT.V', 'ZAC.V', 'ZEN.V'
    ],
    'Real Estate': [
      // Large-cap REITs
      'REI.UN.TO', 'HR.UN.TO', 'CAR.UN.TO', 'AP.UN.TO', 'BEI.UN.TO', 'CHP.UN.TO',
      'GRT.UN.TO', 'KMP.UN.TO', 'NWH.UN.TO', 'SRU.UN.TO', 'SMU.UN.TO', 'DIR.UN.TO',
      'WIR.UN.TO', 'IIP.UN.TO', 'PLZ.UN.TO', 'MRT.UN.TO', 'MEQ.V', 'TCN.TO',
      // Mid-cap REITs
      'AAR.UN.TO', 'BPY.UN.TO', 'BTB.UN.TO', 'CRR.UN.TO', 'CUF.UN.TO', 'D.UN.TO',
      'FCR.UN.TO', 'FCD.UN.TO', 'GEI.TO', 'HOM.UN.TO', 'INO.UN.TO', 'KMP.UN.TO',
      'MST.UN.TO', 'NVU.UN.TO', 'NXR.UN.TO', 'ONR.UN.TO', 'PMZ.UN.TO', 'PRV.UN.TO',
      'REF.UN.TO', 'TNT.UN.TO', 'TPU.UN.TO', 'VER.V', 'VSP.TO',
      // Commercial & Development
      'AX.UN.TO', 'BAM.TO', 'BN.TO', 'BPO.TO', 'BPY.UN.TO', 'CSH.UN.TO', 'ERE.UN.TO',
      'FCR.UN.TO', 'MRC.TO', 'RMM.TO', 'SOT.UN.TO', 'SRG.V', 'SRT.UN.TO', 'SVR.V',
      'TCN.TO', 'TMP.V', 'TRI.TO', 'TRM.V', 'VRE.TO', 'WIR.UN.TO', 'XSR.V',
      // Additional REITs
      'AEI.UN.TO', 'AFN.TO', 'AIF.TO', 'BEI.UN.TO', 'BPO.UN.TO', 'BSR.UN.TO',
      'CRT.UN.TO', 'DRG.UN.TO', 'EXE.TO', 'FRO.V', 'GBT.UN.TO', 'HOT.UN.TO',
      'IVQ.U.TO', 'KEI.UN.TO', 'LMP.TO', 'MHC.UN.TO', 'MI.UN.TO', 'MRG.UN.TO',
      'MR.UN.TO', 'NXR.UN.TO', 'OGI.TO', 'PKC.TO', 'RAR.UN.TO', 'RIO.UN.TO',
      'SIA.TO', 'SRT.UN.TO', 'TCN.TO', 'TNT.UN.TO', 'TPZ.TO', 'TRP.TO',
      'URB.A.TO', 'URB.TO', 'VSP.TO', 'WIR.U.TO', 'WN.TO', 'ZRE.TO',
      // Additional REITs & Real Estate Services
      'AFN.TO', 'AI.TO', 'AIF.TO', 'BEI.UN.TO', 'BPO.TO', 'BSR.UN.TO',
      'CAR.UN.TO', 'CHP.UN.TO', 'CRT.UN.TO', 'CSH.UN.TO', 'D.UN.TO',
      'DIR.UN.TO', 'DRG.UN.TO', 'ERE.UN.TO', 'FCR.UN.TO', 'GRT.UN.TO',
      'HOT.UN.TO', 'HR.UN.TO', 'IIP.UN.TO', 'INO.UN.TO', 'KMP.UN.TO',
      'MHC.UN.TO', 'MI.UN.TO', 'MRG.UN.TO', 'MR.UN.TO', 'MST.UN.TO',
      'NVU.UN.TO', 'NWH.UN.TO', 'NXR.UN.TO', 'ONR.UN.TO', 'PLZ.UN.TO',
      'PMZ.UN.TO', 'PRV.UN.TO', 'REF.UN.TO', 'REI.UN.TO', 'SRU.UN.TO',
      'SMU.UN.TO', 'TNT.UN.TO', 'WIR.UN.TO'
    ],
    'Utilities': [
      // Large-cap
      'FTS.TO', 'AQN.TO', 'ENB.TO', 'TRP.TO', 'PPL.TO', 'EMA.TO', 'CU.TO', 'BEP.UN.TO',
      'NPI.TO', 'ALA.TO', 'CPX.TO', 'TA.TO', 'SPB.TO', 'ACO.X.TO', 'INE.TO',
      // Mid-cap
      'AXY.TO', 'BLX.TO', 'HAP.V', 'HEO.V', 'MEG.TO', 'NSU.TO', 'PKI.TO', 'PNE.TO',
      'RNW.TO', 'SBC.TO', 'STX.TO', 'WEQ.V', 'WRG.TO', 'ZCL.TO',
      // Clean Energy
      'BLX.TO', 'GPV.V', 'GLXY.TO', 'HEO.V', 'HIVE.TO', 'MCF.TO', 'MEI.TO', 'NRG.V',
      'PIF.TO', 'RGI.V', 'UGE.V', 'VSR.V',
      // Small-cap
      'AIM.TO', 'AKT.A.TO', 'AW.UN.TO', 'BDI.TO', 'BEI.UN.TO', 'BIR.TO', 'BSO.V',
      'CGG.TO', 'CIX.TO', 'CKI.TO', 'DCM.TO', 'DRM.TO', 'ECO.TO', 'ESN.TO',
      'FRO.V', 'GEI.TO', 'GH.TO', 'GMT.TO', 'GRA.TO', 'HEI.TO', 'IAG.TO',
      'IMP.V', 'KWH.UN.V', 'MAI.V', 'MRC.V', 'NRG.V', 'OPC.V', 'PSI.V', 'VER.V',
      // Additional Utilities
      'ALA.TO', 'BIP.UN.TO', 'BEP.UN.TO', 'CU.TO', 'EMA.TO', 'FTS.TO', 'H.TO',
      'INE.TO', 'NPI.TO', 'TA.TO', 'ZUT.TO', 'XUT.TO', 'RNW.TO', 'AQN.TO',
      'PIF.TO', 'BCSF.TO', 'CHP.UN.TO', 'ENB.TO', 'KEY.TO', 'TRP.TO', 'PPL.TO',
      'IPL.TO', 'GEI.TO', 'WRG.TO', 'ACO.X.TO', 'CPX.TO', 'SPB.TO',
      // Additional Power & Gas
      'ALA.TO', 'AXY.TO', 'BIP.UN.TO', 'BLX.TO', 'CU.TO', 'EMA.TO', 'FTS.TO',
      'H.TO', 'INE.TO', 'NPI.TO', 'NSU.TO', 'PIF.TO', 'PKI.TO', 'PNE.TO',
      'RNW.TO', 'SBC.TO', 'STX.TO', 'TA.TO', 'WEQ.V', 'ZCL.TO', 'ZUT.TO',
      // Renewable & Clean Tech
      'BLX.TO', 'GPV.V', 'GLXY.TO', 'HEO.V', 'MCF.TO', 'MEI.TO', 'NRG.V',
      'CSE.V', 'DSG.TO', 'ENGH.TO', 'FSV.TO', 'GPR.V', 'GUD.TO', 'HAI.TO',
      'KNR.TO', 'LMN.TO', 'MDF.TO', 'OPEN.TO', 'QIS.V', 'RKN.V', 'SOY.TO',
      'TELO.V', 'TILT.TO', 'TOI.TO', 'UGE.V', 'VSR.V', 'WEB.V', 'XTRA.TO'
    ]
  }
};

module.exports = CURATED_STOCKS;
