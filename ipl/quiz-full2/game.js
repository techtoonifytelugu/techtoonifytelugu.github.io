(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var TIMER_MS=12000, TIMER_TIER={E:20000,M:25000,H:30000}, GAP_MS=1400, TEASE_EVERY=5000;
/* Full show (days 2+3 combined): 30/35/40 s think time and a 14 s beat; own progress key and own data/clips. */
var TIER_FULL={E:30000,M:35000,H:40000}, FULL_GAP_MS=14000;
function tierMs(t){return (DAY===8?TIER_FULL:TIMER_TIER)[t]||TIMER_MS} /* per-tier thinking time: easy 20s, medium 25s, hard 30s (user-approved pace) */
var P=new URLSearchParams(location.search);
var SIM=P.get('sim')==='1',AUTO=P.get('auto')==='1', FAST=parseFloat(P.get('speed')||'1');
var DAY=parseInt(P.get('day')||'8',10)||8; /* 0 = day picker; 1-3 = that day's unseen questions only; 9 = full show, all 3 days combined (~10h) */
if(P.get('all')==='1')DAY=8; /* all = combined remaining programme (days 2+3) */
function inDay(q){var dd=q.day||1; if(!DAY||DAY===9)return true; if(DAY===8)return dd===2||dd===3; return dd===DAY;}
var DBG=P.get('debug')==='1',EV=[],T0=Date.now();
function ev(k){if(DBG){var fs=$('face').src;EV.push({t:Date.now()-T0,ev:k,face:fs.indexOf('laugh')>=0?'laugh':fs.indexOf('sad')>=0?'sad':fs.indexOf('tease')>=0?'tease':'smile'});}}
/* 3-day programme progress lives under its own key: the old iplquiz.seen.v5 test history is left untouched in storage, and the programme starts with every question fresh (prior exposure was private tests only). Within the programme a question once shown never reappears on any day. */
var KEY='iplquiz.full2.v1';
var seen={};try{seen=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
if(P.get('reset')==='1'){seen={};try{localStorage.removeItem(KEY)}catch(e){}}
function saveSeen(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');for(var k in o)seen[k]=1;}catch(e){}try{localStorage.setItem(KEY,JSON.stringify(seen))}catch(e){}}
function syncSeen(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');for(var k in o)seen[k]=1;}catch(e){}}
function fit(){var st=$('stage');
 if(innerWidth<700&&innerHeight>innerWidth&&P.get('desk')!=='1'){ /* phone layout: same 3 sections, text sized for a handheld screen */
  document.body.classList.add('phone');var w=540,h0=innerHeight*540/innerWidth;if(h0<900)w=Math.round(540*900/h0);var h=Math.round(innerHeight*w/innerWidth);st.style.width=w+'px';st.style.height=h+'px';st.style.transform='scale('+(innerWidth/w)+')';}
 else{document.body.classList.remove('phone');st.style.width='1080px';st.style.height='1920px';var s=Math.min(innerWidth/1080,innerHeight/1920);st.style.transform='scale('+s+')';}}
addEventListener('resize',fit);fit();
/* ---- synthesized sounds (original, no samples) ---- */
var AC=null,master=null;
function ac(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;AC=new C();master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);}if(AC.state==='suspended')AC.resume();return AC;}
function tone(f,t0,d,type,g){var a=ac(),o=a.createOscillator(),v=a.createGain();o.type=type||'sine';o.frequency.value=f;v.gain.setValueAtTime(0.0001,t0);v.gain.exponentialRampToValueAtTime(g||0.25,t0+0.01);v.gain.exponentialRampToValueAtTime(0.0001,t0+d);o.connect(v);v.connect(master);o.start(t0);o.stop(t0+d+0.05);}
function sfx(k){try{var a=ac(),t=a.currentTime;
 if(k==='tick')tone(900,t,0.06,'square',0.08);
 if(k==='ding'){tone(880,t,0.5,'sine',0.3);tone(1320,t+0.08,0.7,'sine',0.25);tone(1760,t+0.16,0.9,'sine',0.18);}
 if(k==='sad'){tone(330,t,0.35,'triangle',0.25);tone(247,t+0.3,0.5,'triangle',0.25);}
 if(k==='whoosh'){var o=a.createOscillator(),v=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.25);v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(0.06,t+0.1);v.gain.exponentialRampToValueAtTime(0.0001,t+0.3);o.connect(v);v.connect(master);o.start(t);o.stop(t+0.35);}
 if(k==='pop'){tone(520,t,0.12,'sine',0.2);tone(780,t+0.06,0.14,'sine',0.18);}
}catch(e){}}
/* ---- voice clips ---- */
var voice=new Audio();voice.preload='auto';
var KEPT_LIVE={'0128':1,'0541':1,'1001':1,'1002':1,'1005':1,'1006':1,'1007':1,'1008':1,'1009':1,'1011':1,'1012':1,'1014':1,'1015':1,'1016':1,'1017':1,'1018':1,'1020':1,'1021':1,'1022':1,'1023':1,'1024':1,'1025':1,'1026':1,'1027':1,'1028':1,'1031':1,'1032':1,'1033':1,'1034':1,'1035':1,'1036':1,'1037':1,'1038':1,'1039':1,'1040':1,'1041':1,'1042':1,'1043':1,'1045':1,'1046':1,'1050':1,'1054':1,'1055':1,'1056':1,'1057':1,'1058':1,'1059':1,'1061':1,'1062':1,'1065':1,'1066':1,'1067':1,'1069':1,'1072':1,'1073':1,'1076':1,'1078':1,'1080':1,'1082':1,'1084':1,'1087':1,'1088':1,'1089':1,'1091':1,'1092':1,'1093':1,'1095':1,'1096':1,'1100':1,'1101':1,'1102':1,'1104':1,'1107':1,'1110':1,'1112':1,'1115':1,'1117':1,'1118':1,'1119':1,'1122':1,'1123':1,'1124':1,'1128':1,'1130':1,'1133':1,'1134':1,'1139':1,'1142':1,'1144':1,'1145':1,'1146':1,'1148':1,'1151':1,'1152':1,'1155':1,'1158':1,'1159':1,'1160':1,'1163':1,'1165':1,'1166':1,'1169':1,'1171':1,'1172':1,'1173':1,'1174':1,'1175':1,'1176':1,'1177':1,'1179':1,'1181':1,'1186':1,'1188':1,'1189':1,'1192':1,'1193':1,'1194':1,'1196':1,'1197':1,'1201':1,'1202':1,'1204':1,'1205':1,'1208':1,'1210':1,'1211':1,'1212':1,'1213':1};function CU(n){var m=/^(\d+)-[qa]$/.exec(n);return 'clips/'+n+'.mp3';}
var BIDX={"10-react-correct":[1,0,21693],"11-react-wrong":[1,21693,25293],"2001-a":[1,46986,52941],"2001-q":[1,99927,79725],"2002-a":[1,179652,54381],"2002-q":[1,234033,93693],"2003-a":[1,327726,51501],"2003-q":[1,379227,78285],"2004-a":[1,457512,58845],"2004-q":[1,516357,96285],"2005-a":[1,612642,35805],"2005-q":[1,648447,77565],"2006-a":[1,726012,40413],"2006-q":[1,766425,63165],"2007-a":[1,829590,57261],"2007-q":[1,886851,79725],"2008-a":[1,966576,66333],"2008-q":[1,1032909,76845],"2009-a":[1,1109754,50781],"2009-q":[1,1160535,88221],"2010-a":[1,1248756,45021],"2010-q":[1,1293777,102765],"2011-a":[1,1396542,58413],"2011-q":[1,1454955,76845],"2012-a":[1,1531800,45165],"2012-q":[1,1576965,110253],"2013-a":[1,1687218,37965],"2013-q":[1,1725183,75693],"2014-a":[1,1800876,34365],"2014-q":[1,1835241,63165],"2015-a":[1,1898406,61005],"2015-q":[1,1959411,100173],"2016-a":[1,2059584,61293],"2016-q":[1,2120877,78573],"2017-a":[1,2199450,75405],"2017-q":[1,2274855,91965],"2018-a":[1,2366820,73101],"2018-q":[1,2439921,102765],"2019-a":[1,2542686,87933],"2019-q":[1,2630619,105645],"2020-a":[1,2736264,66765],"2020-q":[1,2803029,129405],"2021-a":[1,2932434,70653],"2021-q":[1,3003087,95133],"2022-a":[1,3098220,69933],"2022-q":[1,3168153,89085],"2023-a":[1,3257238,71805],"2023-q":[1,3329043,82893],"2024-a":[1,3411936,66045],"2024-q":[1,3477981,70653],"2025-a":[1,3548634,61725],"2025-q":[1,3610359,98445],"2026-a":[1,3708804,45885],"2026-q":[1,3754689,83325],"2027-a":[1,3838014,63165],"2027-q":[1,3901179,96285],"2028-a":[1,3997464,53085],"2028-q":[1,4050549,95133],"2029-a":[1,4145682,55101],"2029-q":[1,4200783,82605],"2030-a":[1,4283388,69933],"2030-q":[1,4353321,81453],"2031-a":[1,4434774,52653],"2031-q":[1,4487427,71085],"2032-a":[1,4558512,45885],"2032-q":[1,4604397,73533],"2033-a":[1,4677930,39405],"2033-q":[1,4717335,60861],"2034-a":[1,4778196,49485],"2034-q":[1,4827681,75405],"2035-a":[1,4903086,39981],"2035-q":[1,4943067,69213],"2036-a":[1,5012280,44013],"2036-q":[1,5056293,68205],"2037-a":[1,5124498,41853],"2037-q":[1,5166351,64893],"2038-a":[2,0,45453],"2038-q":[2,45453,78141],"2039-a":[2,123594,51501],"2039-q":[2,175095,102621],"2040-a":[2,277716,47325],"2040-q":[2,325041,77133],"2041-a":[2,402174,56253],"2041-q":[2,458427,79725],"2042-a":[2,538152,60861],"2042-q":[2,599013,95565],"2043-a":[2,694578,85341],"2043-q":[2,779919,130413],"2044-a":[2,910332,49773],"2044-q":[2,960105,80733],"2045-a":[2,1040838,50205],"2045-q":[2,1091043,84333],"2046-a":[2,1175376,43581],"2046-q":[2,1218957,69933],"2047-a":[2,1288890,55965],"2047-q":[2,1344855,95853],"2048-a":[2,1440708,52941],"2048-q":[2,1493649,78285],"2049-a":[2,1571934,40701],"2049-q":[2,1612635,94701],"2050-a":[2,1707336,50205],"2050-q":[2,1757541,72813],"2051-a":[2,1830354,43725],"2051-q":[2,1874079,71661],"2052-a":[2,1945740,50781],"2052-q":[2,1996521,74685],"2053-a":[2,2071206,46605],"2053-q":[2,2117811,83181],"2054-a":[2,2200992,46461],"2054-q":[2,2247453,97725],"2055-a":[2,2345178,45885],"2055-q":[2,2391063,73533],"2056-a":[2,2464596,47325],"2056-q":[2,2511921,87501],"2057-a":[2,2599422,43725],"2057-q":[2,2643147,69933],"2058-a":[2,2713080,45021],"2058-q":[2,2758101,78285],"2059-a":[2,2836386,56253],"2059-q":[2,2892639,88941],"2060-a":[2,2981580,54381],"2060-q":[2,3035961,77565],"2061-a":[2,3113526,43725],"2061-q":[2,3157251,85053],"2062-a":[2,3242304,43725],"2062-q":[2,3286029,78285],"2063-a":[2,3364314,52365],"2063-q":[2,3416679,86925],"2064-a":[2,3503604,44445],"2064-q":[2,3548049,70941],"2065-a":[2,3618990,50061],"2065-q":[2,3669051,82461],"2066-a":[2,3751512,41565],"2066-q":[2,3793077,72813],"2067-a":[2,3865890,54381],"2067-q":[2,3920271,81021],"2068-a":[2,4001292,57981],"2068-q":[2,4059273,91533],"2069-a":[2,4150806,49773],"2069-q":[2,4200579,86493],"2070-a":[2,4287072,44445],"2070-q":[2,4331517,80445],"2071-a":[2,4411962,47901],"2071-q":[2,4459863,76845],"2072-a":[2,4536708,55245],"2072-q":[2,4591953,88653],"2073-a":[2,4680606,45165],"2073-q":[2,4725771,92541],"2074-a":[2,4818312,53805],"2074-q":[2,4872117,72525],"2075-a":[2,4944642,51933],"2075-q":[2,4996575,83613],"2076-a":[2,5080188,66621],"2076-q":[2,5146809,83901],"2077-a":[3,0,73821],"2077-q":[3,73821,99165],"2078-a":[3,172986,72525],"2078-q":[3,245511,79005],"2079-a":[3,324516,50205],"2079-q":[3,374721,97581],"2080-a":[3,472302,80301],"2080-q":[3,552603,102333],"2081-a":[3,654936,37965],"2081-q":[3,692901,81453],"2082-a":[3,774354,48045],"2082-q":[3,822399,87645],"2083-a":[3,910044,49053],"2083-q":[3,959097,95565],"2084-a":[3,1054662,42861],"2084-q":[3,1097523,76845],"2085-a":[3,1174368,53805],"2085-q":[3,1228173,62733],"2086-a":[3,1290906,52365],"2086-q":[3,1343271,75261],"2090-a":[3,1418532,48045],"2090-q":[3,1466577,84333],"2093-a":[3,1550910,45885],"2093-q":[3,1596795,82893],"2094-a":[3,1679688,48333],"2094-q":[3,1728021,75981],"2095-a":[3,1804002,39981],"2095-q":[3,1843983,85053],"2099-a":[3,1929036,39261],"2099-q":[3,1968297,71661],"2100-a":[3,2039958,55965],"2100-q":[3,2095923,92253],"2101-a":[3,2188176,61725],"2101-q":[3,2249901,106653],"2102-a":[3,2356554,60861],"2102-q":[3,2417415,83325],"2103-a":[3,2500740,55533],"2103-q":[3,2556273,73101],"2104-a":[3,2629374,54525],"2104-q":[3,2683899,82173],"2105-a":[3,2766072,46173],"2105-q":[3,2812245,72813],"2106-a":[3,2885058,58413],"2106-q":[3,2943471,63021],"2107-a":[3,3006492,49341],"2107-q":[3,3055833,78573],"2108-a":[3,3134406,45885],"2108-q":[3,3180291,80301],"2109-a":[3,3260592,55101],"2109-q":[3,3315693,73965],"2110-a":[3,3389658,48765],"2110-q":[3,3438423,73533],"2111-a":[3,3511956,46173],"2111-q":[3,3558129,78861],"2112-a":[3,3636990,46893],"2112-q":[3,3683883,74973],"2113-a":[3,3758856,40701],"2113-q":[3,3799557,76413],"2114-a":[3,3875970,45453],"2114-q":[3,3921423,73821],"2115-a":[3,3995244,50205],"2115-q":[3,4045449,77853],"2116-a":[3,4123302,45021],"2116-q":[3,4168323,74973],"2117-a":[3,4243296,45453],"2117-q":[3,4288749,66621],"2118-a":[3,4355370,48765],"2118-q":[3,4404135,75261],"2119-a":[3,4479396,47181],"2119-q":[3,4526577,61581],"2120-a":[3,4588158,41853],"2120-q":[3,4630011,65613],"2121-a":[3,4695624,49773],"2121-q":[3,4745397,64893],"2122-a":[3,4810290,46461],"2122-q":[3,4856751,74973],"2123-a":[3,4931724,46461],"2123-q":[3,4978185,63885],"2124-a":[3,5042070,53373],"2124-q":[3,5095443,63453],"2125-a":[3,5158896,52941],"2125-q":[4,0,68061],"2126-a":[4,68061,47325],"2126-q":[4,115386,66621],"2127-a":[4,182007,54093],"2127-q":[4,236100,69213],"2128-a":[4,305313,51501],"2128-q":[4,356814,75693],"2129-a":[4,432507,46605],"2129-q":[4,479112,73965],"2130-a":[4,553077,46893],"2130-q":[4,599970,73533],"2131-a":[4,673503,44445],"2131-q":[4,717948,81453],"2132-a":[4,799401,39693],"2132-q":[4,839094,63021],"2133-a":[4,902115,49773],"2133-q":[4,951888,69933],"2134-a":[4,1021821,41133],"2134-q":[4,1062954,78141],"2135-a":[4,1141095,46173],"2135-q":[4,1187268,69933],"2136-a":[4,1257201,44733],"2136-q":[4,1301934,73965],"2137-a":[4,1375899,46173],"2137-q":[4,1422072,69501],"2138-a":[4,1491573,44733],"2138-q":[4,1536306,74541],"2139-a":[4,1610847,48045],"2139-q":[4,1658892,71805],"2140-a":[4,1730697,40845],"2140-q":[4,1771542,63165],"2141-a":[4,1834707,41133],"2141-q":[4,1875840,65901],"2142-a":[4,1941741,49773],"2142-q":[4,1991514,73101],"2143-a":[4,2064615,45021],"2143-q":[4,2109636,76125],"2144-a":[4,2185761,47613],"2144-q":[4,2233374,71805],"2145-a":[4,2305179,43005],"2145-q":[4,2348184,69933],"2146-a":[4,2418117,47901],"2146-q":[4,2466018,72813],"2147-a":[4,2538831,48621],"2147-q":[4,2587452,81021],"2148-a":[4,2668473,41565],"2148-q":[4,2710038,77133],"2149-a":[4,2787171,52653],"2149-q":[4,2839824,77133],"2150-a":[4,2916957,47325],"2150-q":[4,2964282,76701],"2151-a":[4,3040983,43725],"2151-q":[4,3084708,72093],"2152-a":[4,3156801,45885],"2152-q":[4,3202686,76413],"2153-a":[4,3279099,48333],"2153-q":[4,3327432,83325],"2154-a":[4,3410757,47181],"2154-q":[4,3457938,79581],"2155-a":[4,3537519,50781],"2155-q":[4,3588300,72381],"2156-a":[4,3660681,48621],"2156-q":[4,3709302,72525],"2157-a":[4,3781827,60861],"2157-q":[4,3842688,77853],"2158-a":[4,3920541,56685],"2158-q":[4,3977226,70653],"2159-a":[4,4047879,61005],"2159-q":[4,4108884,80445],"2160-a":[4,4189329,59421],"2160-q":[4,4248750,75261],"2161-a":[4,4324011,61293],"2161-q":[4,4385304,72093],"2162-a":[4,4457397,52221],"2162-q":[4,4509618,71805],"2163-a":[4,4581423,55533],"2163-q":[4,4636956,77565],"2164-a":[4,4714521,63021],"2164-q":[4,4777542,80445],"2165-a":[4,4857987,49341],"2165-q":[4,4907328,67485],"2166-a":[4,4974813,43725],"2166-q":[4,5018538,79581],"2167-a":[4,5098119,45165],"2167-q":[4,5143284,64605],"2168-a":[5,0,50061],"2168-q":[5,50061,74253],"2169-a":[5,124314,42285],"2169-q":[5,166599,84765],"2170-a":[5,251364,51213],"2170-q":[5,302577,70653],"2171-a":[5,373230,50205],"2171-q":[5,423435,64605],"2172-a":[5,488040,47181],"2172-q":[5,535221,73821],"2173-a":[5,609042,50781],"2173-q":[5,659823,61005],"2174-a":[5,720828,45885],"2174-q":[5,766713,69501],"2175-a":[5,836214,43581],"2175-q":[5,879795,67053],"2176-a":[5,946848,50205],"2176-q":[5,997053,72381],"2177-a":[5,1069434,48621],"2177-q":[5,1118055,70653],"2178-a":[5,1188708,50925],"2178-q":[5,1239633,72381],"2179-a":[5,1312014,42861],"2179-q":[5,1354875,67485],"2180-a":[5,1422360,48621],"2180-q":[5,1470981,63453],"2181-a":[5,1534434,55101],"2181-q":[5,1589535,70653],"2182-a":[5,1660188,47325],"2182-q":[5,1707513,66765],"2183-a":[5,1774278,48333],"2183-q":[5,1822611,68061],"2184-a":[5,1890672,40413],"2184-q":[5,1931085,73965],"2185-a":[5,2005050,43725],"2185-q":[5,2048775,80301],"2186-a":[5,2129076,67485],"2186-q":[5,2196561,103773],"2187-a":[5,2300334,67773],"2187-q":[5,2368107,107661],"2188-a":[5,2475768,63021],"2188-q":[5,2538789,91245],"2189-a":[5,2630034,69213],"2189-q":[5,2699247,90525],"2190-a":[5,2789772,64893],"2190-q":[5,2854665,89661],"2191-a":[5,2944326,75405],"2191-q":[5,3019731,95853],"2192-a":[5,3115584,59421],"2192-q":[5,3175005,95565],"2193-a":[5,3270570,56973],"2193-q":[5,3327543,91245],"2194-a":[5,3418788,67485],"2194-q":[5,3486273,100173],"2195-a":[5,3586446,65901],"2195-q":[5,3652347,82893],"2196-a":[5,3735240,67773],"2196-q":[5,3803013,95565],"2197-a":[5,3898578,65613],"2197-q":[5,3964191,95853],"2198-a":[5,4060044,71805],"2198-q":[5,4131849,101325],"2199-a":[5,4233174,62013],"2199-q":[5,4295187,92685],"2200-a":[5,4387872,56253],"2200-q":[5,4444125,94413],"2201-a":[5,4538538,68925],"2201-q":[5,4607463,90381],"2202-a":[5,4697844,70941],"2202-q":[5,4768785,106365],"2203-a":[5,4875150,65181],"2203-q":[5,4940331,95853],"2204-a":[5,5036184,69645],"2204-q":[5,5105829,80013],"2205-a":[6,0,69645],"2205-q":[6,69645,99741],"2206-a":[6,169386,64461],"2206-q":[6,233847,98013],"2207-a":[6,331860,56253],"2207-q":[6,388113,87213],"2208-a":[6,475326,53373],"2208-q":[6,528699,93405],"2209-a":[6,622104,54093],"2209-q":[6,676197,98301],"2210-a":[6,774498,62301],"2210-q":[6,836799,90813],"2211-a":[6,927612,66765],"2211-q":[6,994377,90525],"2212-a":[6,1084902,62301],"2212-q":[6,1147203,82605],"2213-a":[6,1229808,64605],"2213-q":[6,1294413,99453],"2214-a":[6,1393866,62013],"2214-q":[6,1455879,106221],"2215-a":[6,1562100,61005],"2215-q":[6,1623105,87213],"2216-a":[6,1710318,68925],"2216-q":[6,1779243,104061],"2217-a":[6,1883304,65181],"2217-q":[6,1948485,102045],"2218-a":[6,2050530,56685],"2218-q":[6,2107215,101613],"2219-a":[6,2208828,67053],"2219-q":[6,2275881,108093],"2220-a":[6,2383974,64173],"2220-q":[6,2448147,106653],"2221-a":[6,2554800,67341],"2221-q":[6,2622141,103485],"2222-a":[6,2725626,56541],"2222-q":[6,2782167,105645],"2223-a":[6,2887812,59853],"2223-q":[6,2947665,98301],"2224-a":[6,3045966,67773],"2224-q":[6,3113739,101613],"2225-a":[6,3215352,64893],"2225-q":[6,3280245,109245],"2226-a":[6,3389490,65613],"2226-q":[6,3455103,84765],"2227-a":[6,3539868,58845],"2227-q":[6,3598713,99885],"2228-a":[6,3698598,73245],"2228-q":[6,3771843,100461],"2229-a":[6,3872304,68061],"2229-q":[6,3940365,106941],"2230-a":[6,4047306,63741],"2230-q":[6,4111047,96573],"2231-a":[6,4207620,66765],"2231-q":[6,4274385,81741],"2232-a":[6,4356126,65613],"2232-q":[6,4421739,96141],"2233-a":[6,4517880,69933],"2233-q":[6,4587813,88941],"2234-a":[6,4676754,57405],"2234-q":[6,4734159,89805],"2235-a":[6,4823964,70365],"2235-q":[6,4894329,101181],"2236-a":[6,4995510,61725],"2236-q":[6,5057235,87645],"2237-a":[6,5144880,57693],"2237-q":[7,0,104493],"2238-a":[7,104493,59565],"2238-q":[7,164058,81021],"2239-a":[7,245079,67341],"2239-q":[7,312420,121053],"2240-a":[7,433473,63021],"2240-q":[7,496494,93405],"2241-a":[7,589899,66621],"2241-q":[7,656520,100173],"2242-a":[7,756693,63885],"2242-q":[7,820578,99453],"2243-a":[7,920031,61725],"2243-q":[7,981756,87933],"2244-a":[7,1069689,65181],"2244-q":[7,1134870,92541],"2245-a":[7,1227411,63021],"2245-q":[7,1290432,99165],"2246-a":[7,1389597,64173],"2246-q":[7,1453770,81453],"2247-a":[7,1535223,67341],"2247-q":[7,1602564,96141],"2248-a":[7,1698705,80301],"2248-q":[7,1779006,108381],"2249-a":[7,1887387,65181],"2249-q":[7,1952568,104061],"2250-a":[7,2056629,63885],"2250-q":[7,2120514,99165],"2251-a":[7,2219679,62301],"2251-q":[7,2281980,104205],"2252-a":[7,2386185,67053],"2252-q":[7,2453238,92685],"2253-a":[7,2545923,61725],"2253-q":[7,2607648,89805],"2254-a":[7,2697453,63021],"2254-q":[7,2760474,89085],"2255-a":[7,2849559,65613],"2255-q":[7,2915172,96141],"2256-a":[7,3011313,62445],"2256-q":[7,3073758,95421],"2257-a":[7,3169179,61005],"2257-q":[7,3230184,87933],"2258-a":[7,3318117,60861],"2258-q":[7,3378978,95565],"2259-a":[7,3474543,62733],"2259-q":[7,3537276,106653],"2260-a":[7,3643929,69501],"2260-q":[7,3713430,94125],"2261-a":[7,3807555,71373],"2261-q":[7,3878928,108381],"2262-a":[7,3987309,64605],"2262-q":[7,4051914,102333],"2263-a":[7,4154247,72381],"2263-q":[7,4226628,101181],"2264-a":[7,4327809,65613],"2264-q":[7,4393422,100605],"2265-a":[7,4494027,63885],"2265-q":[7,4557912,97581],"2266-a":[7,4655493,55101],"2266-q":[7,4710594,88221],"2267-a":[7,4798815,64893],"2267-q":[7,4863708,111981],"2268-a":[7,4975689,62445],"2268-q":[7,5038134,90525],"2269-a":[7,5128659,60141],"2269-q":[8,0,95421],"2270-a":[8,95421,62013],"2270-q":[8,157434,82893],"2271-a":[8,240327,61293],"2271-q":[8,301620,100173],"2272-a":[8,401793,66765],"2272-q":[8,468558,94845],"2277-a":[8,1005075,37821],"2277-q":[8,1042896,68493],"2278-a":[8,1111389,50925],"2278-q":[8,1162314,59565],"2279-a":[8,1221879,48621],"2279-q":[8,1270500,66333],"2281-a":[8,1445739,43725],"2281-q":[8,1489464,70941],"2282-a":[8,1560405,46173],"2282-q":[8,1606578,69645],"2283-a":[8,1676223,37533],"2283-q":[8,1713756,74685],"2284-a":[8,1788441,41421],"2284-q":[8,1829862,80301],"2285-a":[8,1910163,37245],"2285-q":[8,1947408,56541],"2286-a":[8,2003949,35805],"2286-q":[8,2039754,54381],"2287-a":[8,2094135,35373],"2287-q":[8,2129508,66621],"2288-a":[8,2196129,38685],"2288-q":[8,2234814,75405],"2289-a":[8,2310219,44301],"2289-q":[8,2354520,71373],"2290-a":[8,2425893,39981],"2290-q":[8,2465874,70221],"2291-a":[8,2536095,40701],"2291-q":[8,2576796,73245],"2292-a":[8,2650041,56973],"2292-q":[8,2707014,74541],"2293-a":[8,2781555,35373],"2293-q":[8,2816928,75405],"2294-a":[8,2892333,50493],"2294-q":[8,2942826,82893],"2295-a":[8,3025719,59565],"2295-q":[8,3085284,67053],"2296-a":[8,3152337,57405],"2296-q":[8,3209742,65325],"2297-a":[8,3275067,53373],"2297-q":[8,3328440,70365],"2298-a":[8,3398805,41421],"2298-q":[8,3440226,88653],"2299-a":[8,3528879,61581],"2299-q":[8,3590460,78861],"2300-a":[8,3669321,42285],"2300-q":[8,3711606,77565],"2301-a":[8,3789171,44013],"2301-q":[8,3833184,70941],"2302-a":[8,3904125,59565],"2302-q":[8,3963690,69933],"2303-a":[8,4033623,42573],"2303-q":[8,4076196,68493],"2306-a":[8,4144689,43725],"2306-q":[8,4188414,68061],"2307-a":[8,4256475,44445],"2307-q":[8,4300920,61725],"2308-a":[8,4362645,38541],"2308-q":[8,4401186,59421],"2309-a":[8,4460607,46173],"2309-q":[8,4506780,78285],"2310-a":[8,4585065,49053],"2310-q":[8,4634118,71805],"2311-a":[8,4705923,41133],"2311-q":[8,4747056,60285],"2312-a":[8,4807341,37965],"2312-q":[8,4845306,69645],"2313-a":[8,4914951,35085],"2313-q":[8,4950036,78141],"2314-a":[8,5028177,41133],"2314-q":[8,5069310,62733],"2315-a":[8,5132043,44013],"2315-q":[9,0,68061],"2316-a":[9,68061,43293],"2316-q":[9,111354,67485],"intro":[9,288897,46173]};
var BFULL={};
function bundleBytes(name){var e=BIDX[name];return fetch('bundle/b'+e[0]+'.bin',{headers:{Range:'bytes='+e[1]+'-'+(e[1]+e[2]-1)}}).then(function(r){
 if(r.status===206)return r.arrayBuffer().then(function(ab){if(ab.byteLength!==e[2])throw new Error('len');return ab;});
 if(r.status===200){if(!BFULL[e[0]])BFULL[e[0]]=r.arrayBuffer();return BFULL[e[0]].then(function(ab){return ab.slice(e[1],e[1]+e[2]);});}
 throw new Error('http'+r.status);});}
function makeClip(name){var a=new Audio();a.preload='auto';
 if(!BIDX[name]){a.src=CU(name);return a;}
 var np=a.play.bind(a),url=null,failed=false;
 var rdy=bundleBytes(name).catch(function(){return bundleBytes(name);}).then(function(ab){url=URL.createObjectURL(new Blob([ab],{type:'audio/mpeg'}));a.src=url;return new Promise(function(r){if(a.readyState>=2)return r();a.addEventListener('canplay',r,{once:true});a.addEventListener('error',r,{once:true});});}).catch(function(){failed=true;});
 a.play=function(){return rdy.then(function(){if(failed)throw new Error('clip fetch failed');return np();});};
 var rv=function(){if(url){var u=url;url=null;setTimeout(function(){URL.revokeObjectURL(u)},3000);}};
 a.addEventListener('ended',rv);
 rdy.then(function(){if(failed)setTimeout(function(){a.dispatchEvent(new Event('error'))},0);});
 return a;}
var CC={};function loadClip(name){if(CC[name]){var c=CC[name];delete CC[name];return c;}return makeClip(name);}
function prefetch(q){if(!q||SIM)return;[q.id+'-q',q.id+'-a'].forEach(function(n){if(!CC[n]){CC[n]=makeClip(n);}});}
var blockedWait=null;
function waitUnblocked(){if(blockedWait)return blockedWait;$('start').style.display='flex';blockedWait=new Promise(function(r){window.__resume=function(){blockedWait=null;$('start').style.display='none';r();};});return blockedWait;}
function playClip(a,maxMs,durMs,onstart){return new Promise(function(res){
 if(SIM){if(onstart)onstart();setTimeout(function(){res(true)},(durMs||3000)/FAST);return;}
 var tries=0;function attempt(){var done=false,tm,started=false;
  function start(){if(started)return;started=true;if(onstart)onstart();}
  function fin(ok){if(done)return;done=true;clearTimeout(tm);a.onended=a.onerror=a.onplaying=null;res(ok);}
  a.onended=function(){fin(true)};a.onerror=function(){fin(false)};a.onplaying=start;
  tm=setTimeout(function(){fin(false)},maxMs||40000);
  a.currentTime=0;var p=a.play();
  if(p&&p.then)p.then(start);
  if(p&&p.catch)p.catch(function(err){if(done)return;clearTimeout(tm);done=true;if(err&&err.name==='NotAllowedError'&&tries++<3){waitUnblocked().then(function(){attempt()});}else res(false);});}
 attempt();});}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms/FAST)})}
/* ---- Mini content (text only; no voice for teases) ---- */
var TEASE=[
 'ఏమిటి అందరూ ఇంకా ఆలోచిస్తున్నారా? ఇది మీకు తెలిసే ఉంటుంది!',
 'కామెంట్స్‌లో మీ సమాధానం రాయండి, నేను చూస్తున్నాను!',
 'మిని సమాధానం చెప్పేస్తే మజా ఉండదు, మీరు చెప్పండి!',
 'టైమ్ అయిపోతోంది, త్వరగా త్వరగా!',
 'హ్మ్... ఈ ఆప్షన్ మీద నాకు డౌట్ వస్తోంది!',
 'క్రికెట్ ఫ్యాన్స్ అంటే ఇలాంటివి ఈజీగా చెప్పేయాలి కదా!',
 'ఎవరు ముందు కరెక్ట్ చెబుతారో చూద్దాం!'];
/* user request 2026-11-23: Mini's own result lines. Correct guess: after the answer narration fully ends. Wrong guess: before the answer narration (verdict first, then the answer for viewers) */
var REACT_OK='సరైన సమాధానం! Congratulations మిని!';
var REACT_NO='ఈ సారి కాదు! Better luck next time!';
var REACT_DUR_OK=3600,REACT_DUR_NO=4200; /* measured reaction clip lengths (ms); the miss path never blocks longer than maxMs */
var REACT_MS=3900; /* average reaction length, used only for day-length estimates */
var TAGS={E:'EASY',M:'MEDIUM',H:'HARD'};
var ENDTXT={0:['ఈ రౌండ్ ముగిసింది!','చూసినందుకు ధన్యవాదాలు. త్వరలో మళ్ళీ కలుద్దాం!'],1:['దినం 1 ముగిసింది!','రేపు దినం 2తో కలుద్దాం! జై ఐపీఎల్!'],2:['దినం 2 ముగిసింది!','రేపు చివరి రోజు. దినం 3తో కలుద్దాం!'],3:['దినం 3 ముగిసింది!','మూడు రోజుల ఐపీఎల్ క్విజ్ పూర్తయింది. చూసినందుకు ధన్యవాదాలు!'],9:['పూర్తి షో ముగిసింది!','మూడు రోజుల ఐపీఎల్ క్విజ్ ఒక్క లైవ్‌లో పూర్తయింది. చూసినందుకు ధన్యవాదాలు! జై ఐపీఎల్!'],8:['పూర్తి షో ముగిసింది!','దినం 2 మరియు దినం 3 ప్రశ్నలన్నీ పూర్తయ్యాయి. చూసినందుకు ధన్యవాదాలు! జై ఐపీఎల్!']};
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function setFace(ok){var f=$('face');f.src=ok?'img/smile.png':'img/14-laugh.png';var av=f.parentNode;av.classList.remove('teasing');av.classList.remove('pop');void av.offsetWidth;av.classList.add('pop');}
/* playful mocking waggle every tease (~5s during the timer); never swaps the face, so it can't hint the result */
var teaseT=null;(new Image()).src='img/tease.png';
function teaseFace(){var f=$('face'),av=f.parentNode;av.classList.remove('teasing');void av.offsetWidth;av.classList.add('teasing');
 if(f.src.indexOf('sad.png')<0&&f.src.indexOf('laugh.png')<0)f.src='img/tease.png';
 clearTimeout(teaseT);teaseT=setTimeout(function(){if(f.src.indexOf('tease.png')>=0)f.src='img/smile.png';},1400/FAST);
 ev('tease-face');}
$('face').parentNode.addEventListener('animationend',function(e){if(e.animationName==='tease')this.classList.remove('teasing');});
var D=null,order=[],score=0,asked=0,running=false;
function buildOrder(){var rank={E:0,M:1,H:2};var g={E:[],M:[],H:[]};
 D.questions.forEach(function(q){if(P.get('only')&&q.id!==P.get('only'))return;if(!inDay(q))return;if(!seen[q.id])g[q.tier].push(q)});
 /* easy -> medium -> hard, shuffled within a band; bands blend so it never feels like a wall */
 var all=[].concat(shuffle(g.E),shuffle(g.M),shuffle(g.H));
 var keyed=all.map(function(q,i){return {q:q,k:i+Math.random()*all.length*0.25}});
 keyed.sort(function(a,b){return a.k-b.k});return keyed.map(function(x){return x.q});}
function renderQ(q,n){
 $('qnum').textContent='ప్రశ్న '+n;$('qnumen').textContent=n;
 $('tag').textContent=TAGS[q.tier]||'';$('qte').textContent=q.qte;$('qen').textContent=q.qen||'';
 var o=$('opts');o.innerHTML='';
 q.ote.forEach(function(t,i){var d=document.createElement('div');d.className='opt';d.id='o'+i;
  d.innerHTML='<div class="badge">'+'ABCD'[i]+'</div><div><span class="te"></span><span class="en2 en"></span></div>';
  d.querySelector('.te').textContent=t;d.querySelector('.en2').textContent=q.oen[i]!==t?q.oen[i]:'';o.appendChild(d);});
 $('timer').textContent='⏱ --';$('tbar').style.width='0';$('tbar').style.transition='none';
 setFace(true);$('cstate').textContent='';$('cstate').className='chitti-state';$('ctease').textContent='';$('cans').textContent='';
 var ds=$('dots');ds.innerHTML='';for(var i=0;i<5;i++){var e=document.createElement('div');e.className='dot'+(i<(n-1)%5+1?'':' off');ds.appendChild(e);}
}
/* test hook: ?rig=1,3 forces the next guesses; normal play is a fresh uniform random pick every question (user request 2026-11-23, no correct-answer bias) */
var RIG=(P.get('rig')||'').split(',').filter(function(s){return s!=='';});
function miniGuess(q){if(RIG.length)return parseInt(RIG.shift(),10)&3;return Math.floor(Math.random()*4);}
async function timerPhase(q,guess){
 var start=Date.now(),total=tierMs(q.tier)/FAST,lastTick=-1,nextTease=1800/FAST,ti=0;
 var guessAt=8000/FAST,guessed=false;
 $('tbar').style.transition='width '+(total/1000)+'s linear';$('tbar').style.width='100%';
 var teases=shuffle(TEASE.slice());
 while(true){
  var el=Date.now()-start;if(el>=total)break;
  if(P.get('hold')==='timer'&&el>5000){$('ctease').textContent=TEASE[0];await new Promise(function(){});}
  var left=Math.ceil((total-el)*FAST/1000);$('timer').textContent='⏱ 00:'+(left<10?'0':'')+left;
  if(left<=5&&left!==lastTick){lastTick=left;sfx('tick');}
  if(el>=nextTease&&total-el>1500/FAST){nextTease+=TEASE_EVERY/FAST;$('ctease').textContent=teases[ti++%teases.length];sfx('pop');teaseFace();ev('tease');
    $('cstate').textContent='';}
  /* Mini announces her guess mid-timer; it is her pick (can be wrong), not the answer, and the result reveal still waits for the answer voice */
  if(!guessed&&el>=guessAt){guessed=true;
    $('cans').innerHTML='';var gb=document.createElement('b');gb.textContent='మిని అంచనా: '+'ABCD'[guess]+'!';$('cans').appendChild(gb);
    sfx('pop');teaseFace();ev('guess');}
  await new Promise(function(r){setTimeout(r,100)});
 }
 $('timer').textContent='⏱ 00:00';
}
var NEXT=null;
async function runQuestion(q,n){
 var qa=loadClip(q.id+'-q'),aa=loadClip(q.id+'-a');
 seen[q.id]=1;saveSeen();
 renderQ(q,n);sfx('whoosh');ev('question');
 await sleep(500);
 await playClip(qa,q.qd+8000,q.qd);
 var guess=miniGuess(q);
 var ok=guess===q.c;
 var ra=loadClip(ok?'10-react-correct':'11-react-wrong'); /* preloads during the thinking timer */
 prefetch(NEXT);
 await timerPhase(q,guess);
 /* reveal split (user request 2026-11-23): on a wrong guess the laugh/retry verdict plays FIRST, then the answer narration for viewers. Verdict UI (face, Mini's line, score) fires with whichever voice carries the verdict; the correct-answer highlight and reason still fire only when the answer audio actually starts, so the answer is never revealed early. Fallbacks run only if a clip itself failed. */
 await sleep(350);
 var verdictShown=false;
 function showVerdict(src){if(verdictShown)return;verdictShown=true;ev(src);
  score+=ok?1:0;
  $('score').textContent='మిని స్కోరు '+score+' / '+n;
  setFace(ok);sfx(ok?'ding':'sad');
  $('cstate').textContent=ok?REACT_OK:REACT_NO;$('cstate').className='chitti-state'+(ok?'':' sad');
  $('cans').innerHTML='';var b=document.createElement('b');b.textContent='మిని అంచనా: '+'ABCD'[guess]+'. '+q.ote[guess];$('cans').appendChild(b);}
 var answerShown=false;
 function showAnswer(src){if(answerShown)return;answerShown=true;ev(src);
  for(var i=0;i<4;i++){$('o'+i).classList.add(i===q.c?'correct':'dim');}
  $('ctease').textContent=q.why;
  ev('reveal-ui');}
 var played;
 if(ok){
  /* correct guess: answer narration, then the congratulations reaction (reviewed flow, unchanged) */
  ev('answer-play-invoked');
  played=playClip(aa,q.ad+8000,q.ad,function(){showVerdict('verdict-answer-start');showAnswer('answer-playing');});
  if(P.get('hold')==='reveal'){await new Promise(function(){});}
  await played;showVerdict('verdict-fallback');showAnswer('reveal-fallback');ev('answer-voice-end');
  ev('react-play-invoked');await playClip(ra,REACT_DUR_OK+8000,REACT_DUR_OK);ev('react-voice-end');
 }else{
  /* wrong guess: laugh/retry reaction first, then the correct-answer narration; if a clip fails, the shown text/face stay and the quiz moves on */
  ev('react-play-invoked');
  await playClip(ra,REACT_DUR_NO+8000,REACT_DUR_NO,function(){showVerdict('verdict-react-start');});
  showVerdict('verdict-react-fallback');ev('react-voice-end');
  ev('answer-play-invoked');
  played=playClip(aa,q.ad+8000,q.ad,function(){showAnswer('answer-playing');});
  if(P.get('hold')==='reveal'){await new Promise(function(){});}
  await played;showAnswer('reveal-fallback');ev('answer-voice-end');
 }
 if(DAY===8){$('ctease').textContent='తర్వాతి ప్రశ్న వస్తోంది... కామెంట్స్‌లో మీ సమాధానం చెప్పండి!';}
 await sleep(DAY===8?FULL_GAP_MS:GAP_MS);
}
var DATA_PROMISE=null;
function loadData(){if(!DATA_PROMISE){DATA_PROMISE=(async function(){for(;;){try{D=await (await fetch('data.json?'+Date.now())).json();return D}catch(e){await sleep(5000)}}})();}return DATA_PROMISE;}
function fmtDur(ms){var h=ms/3600000;return h>=1?(Math.round(h*10)/10)+' గంటలు':Math.max(1,Math.round(ms/60000))+' నిమిషాలు';}
function dayStats(d){var tot=0,un=0,ms=0;D.questions.forEach(function(q){var dd=q.day||1;if(d===8){if(dd===1)return}else if(d!==9&&dd!==d)return;tot++;if(!seen[q.id]){un++;ms+=(q.qd||13000)+(q.ad||9000)+850+(d===8?FULL_GAP_MS:GAP_MS)+REACT_MS+((d===8?TIER_FULL:TIMER_TIER)[q.tier]||TIMER_MS);}});return{total:tot,unseen:un,ms:ms};}
function buildPicker(){var box=$('daybtns');if(!box)return;box.innerHTML='';
 var fs=dayStats(8),fb=document.createElement('button');fb.className='daybtn fullday';
 if(!fs.unseen){fb.disabled=true;fb.innerHTML='<b>పూర్తి షో · దినం 2 + 3 కలిపి</b><span>పూర్తయింది ✓</span>';}
 else{fb.innerHTML='<b>పూర్తి షో · దినం 2 + 3 కలిపి</b><span>'+fs.unseen+' ప్రశ్నలు · సుమారు '+fmtDur(fs.ms)+'</span>';fb.onclick=function(){DAY=8;begin();};}
 box.appendChild(fb);
 [1,2,3].forEach(function(d){var st=dayStats(d),b=document.createElement('button');b.className='daybtn';
  if(!st.unseen){b.disabled=true;b.innerHTML='<b>దినం '+d+'</b><span>పూర్తయింది ✓</span>';}
  else{b.innerHTML='<b>దినం '+d+'</b><span>'+st.unseen+' ప్రశ్నలు · సుమారు '+fmtDur(st.ms)+'</span>';b.onclick=function(){DAY=d;begin();};}
  box.appendChild(b);});}
function setupStart(){loadData().then(function(){syncSeen();
 if(DAY){var go=$('go');go.style.display='';go.textContent=(DAY===8||DAY===9)?'▶ పూర్తి షో ప్రారంభించండి / Start Full Show':'▶ దినం '+DAY+' ప్రారంభించండి / Start Day '+DAY;var ds=$('daysub');if(ds)ds.style.display='none';}
 else buildPicker();});}
async function main(){
 running=true;
 D=await loadData();
 if(DAY)$('roundname').textContent=DAY===9?'ఐపీఎల్ క్విజ్ · పూర్తి షో':DAY===8?'ఐపీఎల్ క్విజ్ · దినం 2+3':'ఐపీఎల్ క్విజ్ · దినం '+DAY;
 order=buildOrder();
 if(D.intro&&!seen.__intro){var ia=loadClip('intro');$('qte').textContent='ఐపీఎల్ క్విజ్ షోకి స్వాగతం!';$('qen').textContent='Welcome to the IPL Quiz Show!';$('opts').innerHTML='';await playClip(ia,D.intro.d+6000,D.intro.d);seen.__intro=1;saveSeen();}
 var n=D.questions.filter(function(q){return inDay(q)&&seen[q.id]}).length;
 for(var i=0;i<order.length;i++){
  syncSeen();if(seen[order[i].id])continue;
  NEXT=null;for(var j=i+1;j<order.length;j++){if(!seen[order[j].id]){NEXT=order[j];break;}}
  try{await runQuestion(order[i],++n);}catch(e){console.error(e);await sleep(1500);}
 }
 var et=ENDTXT[DAY]||ENDTXT[0],eb=$('end');eb.querySelector('.big2').textContent=et[0];eb.querySelector('.endsub').textContent=et[1];eb.style.display='flex';document.title='END day='+DAY+' asked='+n;
}
function begin(){$('start').style.display='none';try{ac()}catch(e){}try{var pr=makeClip('intro');pr.volume=0;var pp=pr.play();if(pp&&pp.then)pp.then(function(){pr.pause()});if(pp&&pp.catch)pp.catch(function(){})}catch(e){}if(window.__resume)window.__resume();if(!running)main();}
$('go').onclick=begin;
if(!AUTO)setupStart();
if(AUTO){ // OBS / kiosk: pick the earliest day with fresh questions, then try to start right away; fall back to the start button if audio is blocked
 loadData().then(function(){syncSeen();
  if(P.get('all')==='1'){if(dayStats(8).unseen>0)DAY=8;}
  if(!DAY){for(var d=1;d<=3;d++){if(dayStats(d).unseen>0){DAY=d;break;}}
   if(!DAY){var et=ENDTXT[3],eb=$('end');eb.querySelector('.big2').textContent=et[0];eb.querySelector('.endsub').textContent=et[1];eb.style.display='flex';$('start').style.display='none';return;}}
  try{ac();if(AC.state==='running'){begin();}}catch(e){}
  var probe=makeClip('intro');probe.volume=0;probe.play().then(function(){probe.pause();begin();}).catch(function(){});
 });
}

async function sweep(){
 D=await (await fetch('data.json')).json();var res=[];
 var wh=[REACT_OK,REACT_NO].sort(function(a,b){return b.length-a.length})[0];
 D.questions.forEach(function(q,k){
  renderQ(q,k+1);
  for(var i=0;i<4;i++){$('o'+i).classList.add(i===q.c?'correct':'dim');}
  $('cstate').textContent=wh;$('ctease').textContent=q.why;$('cans').innerHTML='<b>మిని అంచనా: D. '+q.ote[3]+'</b>';
  var st=$('stage').getBoundingClientRect(),H=$('stage').offsetHeight,sc=st.height/H,c=$('chitti').getBoundingClientRect();
  var oo=$('opts').getBoundingClientRect(),w=0;document.querySelectorAll('.opt').forEach(function(e){w=Math.max(w,e.scrollWidth-e.clientWidth)});
  res.push({id:q.id,H:H,chittiBottom:Math.round((c.bottom-st.top)/sc),ratio:+(((c.bottom-st.top)/sc)/H).toFixed(3),optsBottom:Math.round((oo.bottom-st.top)/sc),overflowX:w});
 });
 var pre=document.createElement('pre');pre.id='sweep';pre.textContent=JSON.stringify(res);document.body.appendChild(pre);
}
if(P.get('sweep')==='1'){document.fonts.ready.then(function(){setTimeout(sweep,1500)});}
window.__ipl={status:function(){return {running:running,score:score,seen:Object.keys(seen).length,left:order.length}},log:function(){return EV}};
})();
