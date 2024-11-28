// @ts-ignore
export const __VERSION__ = process.global.__VERSION__;

export const code = `const oo = document;
const jj = JSON;
const ll = localStorage;
function m() {
    const DEVICE_ID_KEY_IN_COOKIE = "cna";
    const user = jj.parse(ll.getItem("token") || "null");
    if (user === null) {
        alert("请先登录");
        return;
    }
    const cookies = pp(oo.cookie);
    const device_id = cookies[DEVICE_ID_KEY_IN_COOKIE];
    if (!device_id) {
        alert("请先登录");
        return;
    }
    const {access_token, avatar, default_drive_id, expire_time, nick_name, refresh_token, user_id, user_name, } = user;
    const result = {
        app_id: window.Global.app_id,
        drive_id: default_drive_id,
        device_id,
        user_id,
        nick_name,
        user_name,
        avatar,
        access_token,
        refresh_token,
    };
    const result_str = jj.stringify(result);
    cc(result_str);
    console.log("云盘信息已复制到粘贴板，请粘贴到新增云盘处");
    return result_str;
}
function pp(cookie_str) {
    if (!cookie_str) {
        return {};
    }
    const result = {};
    const key_and_values = cookie_str.split("; ");
    for (let i = 0; i < key_and_values.length; i += 1) {
        const [key,value] = key_and_values[i].split("=");
        result[key] = value;
    }
    return result;
}
function cc(str) {
    const textArea = oo.createElement("textarea");
    textArea.value = str;
    oo.body.appendChild(textArea);
    textArea.select();
    oo.execCommand("copy");
    oo.body.removeChild(textArea);
}
m();`;

const code_prefix = "";
// esbuild index.js --outfile=dist/index.js --format=cjs --bundle --minify
// 压缩后的代码
export const code_get_drive_token = `${code_prefix}var o=document,i=JSON,m=localStorage;function k(){let t="cna",e=i.parse(m.getItem("token")||"null");if(e===null){alert("\u8BF7\u5148\u767B\u5F55");return}let n=v(o.cookie)[t];if(!n){alert("请先登录");return}let{access_token:r,avatar:s,default_drive_id:a,expire_time:g,nick_name:u,refresh_token:d,user_id:_,user_name:p}=e,f={app_id:window.Global.app_id,drive_id:a,device_id:n,user_id:_,nick_name:u,user_name:p,avatar:s,access_token:r,refresh_token:d},l=i.stringify(f);return y(l),console.log("云盘信息已复制到粘贴板，请粘贴到新增云盘处"),l}function v(t){if(!t)return{};let e={},c=t.split("; ");for(let n=0;n<c.length;n+=1){let[r,s]=c[n].split("=");e[r]=s}return e}function y(t){let e=o.createElement("textarea");e.value=t,o.body.appendChild(e),e.select(),o.execCommand("copy"),o.body.removeChild(e)}k();`;

export enum FileType {
  File = 1,
  Folder = 2,
}

export enum DriveFileType {
  File = 1,
  Folder = 2,
  Unknown = 3,
}

/**
 * @doc https://www.iso.org/standard/63545.html
 */
export enum MediaOriginCountries {
  US = "US", // 美国 (United States)
  CN = "CN", // 中国 (China)
  TW = "TW", // 中国台湾 (Taiwan)
  HK = "HK", // 中国香港 (Hong Kong)
  JP = "JP", // 日本 (Japan)
  DE = "DE", // 德国 (Germany)
  GB = "GB", // 英国 (United Kingdom)
  FR = "FR", // 法国 (France)
  IT = "IT", // 意大利 (Italy)
  BR = "BR", // 巴西 (Brazil)
  CA = "CA", // 加拿大 (Canada)
  AU = "AU", // 澳大利亚 (Australia)
  IN = "IN", // 印度 (India)
  RU = "RU", // 俄罗斯 (Russia)
  KR = "KR", // 韩国 (South Korea)
  BE = "BE", // 比利时
  ES = "ES", // 西班牙 (Spain)
  MX = "MX", // 墨西哥 (Mexico)
  ID = "ID", // 印度尼西亚 (Indonesia)
  TR = "TR", // 土耳其 (Turkey)
  SA = "SA", // 沙特阿拉伯 (Saudi Arabia)
  ZA = "ZA", // 南非 (South Africa)
  AR = "AR", // 阿根廷 (Argentina)
  TH = "TH", // 泰国 (Thailand)
  EG = "EG", // 埃及 (Egypt)
  NL = "NL", // 荷兰 (Netherlands)
  CH = "CH", // 瑞士 (Switzerland)
  SE = "SE", // 瑞典 (Sweden)
  PL = "PL", // 波兰 (Poland)
  PK = "PK", // 巴基斯坦 (Pakistan)
  NG = "NG", // 尼日利亚 (Nigeria)
  MY = "MY", // 马来西亚 (Malaysia)
  BD = "BD", // 孟加拉国 (Bangladesh)
}

export const SeasonMediaOriginCountryTextMap: Record<MediaOriginCountries, string> = {
  [MediaOriginCountries.CN]: "国产剧",
  [MediaOriginCountries.TW]: "台剧",
  [MediaOriginCountries.HK]: "港剧",
  [MediaOriginCountries.JP]: "日剧",
  [MediaOriginCountries.KR]: "韩剧",
  [MediaOriginCountries.US]: "美剧",
  [MediaOriginCountries.GB]: "英剧",
  [MediaOriginCountries.FR]: "法国",
  [MediaOriginCountries.IT]: "意大利",
  [MediaOriginCountries.BR]: "巴西",
  [MediaOriginCountries.DE]: "德国",
  [MediaOriginCountries.CA]: "加拿大",
  [MediaOriginCountries.AU]: "澳大利亚",
  [MediaOriginCountries.IN]: "印度",
  [MediaOriginCountries.RU]: "俄罗斯",
  [MediaOriginCountries.ES]: "西班牙",
  [MediaOriginCountries.MX]: "墨西哥",
  [MediaOriginCountries.ID]: "印度尼西亚",
  [MediaOriginCountries.TR]: "土耳其",
  [MediaOriginCountries.SA]: "沙特阿拉伯",
  [MediaOriginCountries.ZA]: "南非",
  [MediaOriginCountries.AR]: "阿根廷",
  [MediaOriginCountries.TH]: "泰国",
  [MediaOriginCountries.EG]: "埃及",
  [MediaOriginCountries.NL]: "荷兰",
  [MediaOriginCountries.CH]: "瑞士",
  [MediaOriginCountries.SE]: "瑞典",
  [MediaOriginCountries.PL]: "波兰",
  [MediaOriginCountries.PK]: "巴基斯坦",
  [MediaOriginCountries.NG]: "尼日利亚",
  [MediaOriginCountries.MY]: "马来西亚",
  [MediaOriginCountries.BD]: "孟加拉国",
  [MediaOriginCountries.BE]: "比利时",
};

export const MovieMediaOriginCountryTextMap: Record<MediaOriginCountries, string> = {
  [MediaOriginCountries.CN]: "中国大陆",
  [MediaOriginCountries.TW]: "中国台湾",
  [MediaOriginCountries.HK]: "中国香港",
  [MediaOriginCountries.JP]: "日本",
  [MediaOriginCountries.KR]: "韩国",
  [MediaOriginCountries.US]: "美国",
  [MediaOriginCountries.GB]: "英国",
  [MediaOriginCountries.FR]: "法国",
  [MediaOriginCountries.IT]: "意大利",
  [MediaOriginCountries.BR]: "巴西",
  [MediaOriginCountries.DE]: "德国",
  [MediaOriginCountries.CA]: "加拿大",
  [MediaOriginCountries.AU]: "澳大利亚",
  [MediaOriginCountries.IN]: "印度",
  [MediaOriginCountries.RU]: "俄罗斯",
  [MediaOriginCountries.BE]: "比利时",
  [MediaOriginCountries.ES]: "西班牙",
  [MediaOriginCountries.MX]: "墨西哥",
  [MediaOriginCountries.ID]: "印度尼西亚",
  [MediaOriginCountries.TR]: "土耳其",
  [MediaOriginCountries.SA]: "沙特阿拉伯",
  [MediaOriginCountries.ZA]: "南非",
  [MediaOriginCountries.AR]: "阿根廷",
  [MediaOriginCountries.TH]: "泰国",
  [MediaOriginCountries.EG]: "埃及",
  [MediaOriginCountries.NL]: "荷兰",
  [MediaOriginCountries.CH]: "瑞士",
  [MediaOriginCountries.SE]: "瑞典",
  [MediaOriginCountries.PL]: "波兰",
  [MediaOriginCountries.PK]: "巴基斯坦",
  [MediaOriginCountries.NG]: "尼日利亚",
  [MediaOriginCountries.MY]: "马来西亚",
  [MediaOriginCountries.BD]: "孟加拉国",
};
export const MediaSourceOptions = Object.keys(SeasonMediaOriginCountryTextMap)
  .slice(0, 7)
  .map((value) => {
    return {
      value,
      label: SeasonMediaOriginCountryTextMap[value as MediaOriginCountries],
    };
  });
export const TVGenres = [
  "动作冒险",
  "动画",
  "喜剧",
  "犯罪",
  "纪录",
  "剧情",
  "家庭",
  "儿童",
  "悬疑",
  "新闻",
  "真人秀",
  "Sci-Fi & Fantasy",
  "肥皂剧",
  "脱口秀",
  "War & Politics",
  "西部",
];
export const TVGenresOptions = TVGenres.map((text) => {
  return {
    label: text,
    value: text,
  };
});
export const MovieGenres = [
  "动作",
  "冒险",
  "动画",
  "喜剧",
  "犯罪",
  "纪录",
  "剧情",
  "家庭",
  "奇幻",
  "历史",
  "恐怖",
  "音乐",
  "悬疑",
  "爱情",
  "科幻",
  "电视电影",
  "惊悚",
  "战争",
  "西部",
];
export const MovieGenresOptions = TVGenres.map((text) => {
  return {
    label: text,
    value: text,
  };
});

export enum ReportTypes {
  /** 电视剧问题 */
  TV,
  /** 电影问题 */
  Movie,
  /** 问题与建议 */
  Question,
  /** 想看什么剧 */
  Want,
}
export const ReportTypeTexts = {
  [ReportTypes.TV]: "电视剧",
  [ReportTypes.Movie]: "电影",
  [ReportTypes.Question]: "问题反馈",
  [ReportTypes.Want]: "想看",
};
export enum SubtitleLanguages {
  Chs = "chs",
  Cht = "cht",
  Eng = "eng",
  Jpn = "jpn",
  ChsWithEng = "chs&eng",
}
export const SubtitleLanguageTexts = {
  [SubtitleLanguages.Chs]: "中文",
  [SubtitleLanguages.Cht]: "中文繁体",
  [SubtitleLanguages.Eng]: "英文",
  [SubtitleLanguages.Jpn]: "日文",
  [SubtitleLanguages.ChsWithEng]: "中英对照",
};
export const SubtitleLanguageOptions = Object.keys(SubtitleLanguageTexts).map((lang) => {
  return {
    value: lang,
    label: SubtitleLanguageTexts[lang as keyof typeof SubtitleLanguageTexts],
  };
});

export enum DriveTypes {
  /** 阿里云盘/备份盘 */
  AliyunBackupDrive = 0,
  /** 阿里云盘/资源盘 */
  AliyunResourceDrive = 1,
  /** 天翼云盘 */
  Cloud189Drive = 2,
  /** 夸克 */
  QuarkDrive = 3,
  /** 迅雷 */
  XunleiDrive = 4,
  /** 本地文件 */
  LocalFolder = 5,
}

export enum MediaErrorTypes {
  Unknown = 0,
  Season = 1,
  Movie = 2,
  Episode = 3,
  TV = 5,
  TVProfile = 6,
  SeasonProfile = 7,
  MovieProfile = 8,
  EpisodeProfile = 9,
}
export const MediaErrorTypeTextMap: Record<MediaErrorTypes, string> = {
  [MediaErrorTypes.Unknown]: "未知",
  [MediaErrorTypes.TVProfile]: "电视剧详情",
  [MediaErrorTypes.SeasonProfile]: "季详情",
  [MediaErrorTypes.EpisodeProfile]: "剧集详情",
  [MediaErrorTypes.MovieProfile]: "电影详情",
  [MediaErrorTypes.TV]: "电视剧",
  [MediaErrorTypes.Season]: "季",
  [MediaErrorTypes.Episode]: "剧集",
  [MediaErrorTypes.Movie]: "电影",
};
export const MediaErrorTypeOptions = Object.keys(MediaErrorTypeTextMap).map((k) => {
  return {
    value: Number(k),
    label: MediaErrorTypeTextMap[k as unknown as MediaErrorTypes],
  };
});

export enum MediaTypes {
  Season = 1,
  Movie = 2,
}

export enum CollectionTypes {
  /** 手动创建 */
  Manually = 1,
  /** 每日更新 */
  DailyUpdate = 2,
  /** 每日更新草稿 */
  DailyUpdateDraft = 3,
  /** 每日更新存档 */
  DailyUpdateArchive = 4,
  /** 手动创建的排行榜 */
  ManuallyRank = 5,
}
