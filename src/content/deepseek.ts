console.log("Zebra Content Script loaded for DeepSeek.");

// Example: Send a message to the background script
chrome.runtime.sendMessage(
  { greeting: "hello from deepseek content script" },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error sending message from deepseek.ts:",
        chrome.runtime.lastError.message,
      );
    } else {
      console.log("Response from background:", response);
    }
  },
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_localStorage_token" && request.key) {
    const tokenValue = localStorage.getItem(request.key);

    sendResponse({ token: tokenValue });
    // It's good practice to return true if sendResponse might be called asynchronously,
    // but localStorage.getItem is synchronous. However, to be safe and consistent:
    return true;
  }
});

// {"code":0,"msg":"","data":{"biz_code":0,"biz_msg":"",
// "biz_data":{"id":"0155d397-d935-4d60-9168-b4cd16bac2eb",
// "token":"m9an1eCMLbBon+05fMnfVGUyAiKPdCvEtWwwBIm5T1YXb6UlQeAw7e+FKLIdTa/k",
// "email":"fad*******oud@gmail.com","mobile_number":"","area_code":"","status":0,
// "id_profile":{"provider":"GOOGLE","id":"336938c3-190e-48ab-be1c-5123a338ae77",
// "name":"Fadwa Mahmoud",
// "picture":"https://deepseek-user-avatar.obs.cn-east-3.myhuaweicloud.com/a/jEVJRm1CGd0DDzyyktVz9Hrv?response-cache-control=max-age=0",
// "locale":**** "en_US","email":"fad*******oud@gmail.com"},
// "id_profiles":[{"provider":"GOOGLE","id":"336938c3-190e-48ab-be1c-5123a338ae77",
// "name":"Fadwa Mahmoud","picture":"https://deepseek-user-avatar.obs.cn-east-3.myhuaweicloud.com/a/jEVJRm1CGd0DDzyyktVz9Hrv?response-cache-control=max-age=0",
// "locale":"en_US","email":"fad*******oud@gmail.com"}],"chat":{"is_muted":0,"mute_until":0},
// "has_legacy_chat_history":false,"need_birthday":false}}}

fetch("https://chat.deepseek.com/api/v0/users/current", {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    authorization:
      "Bearer m9an1eCMLbBon+05fMnfVGUyAiKPdCvEtWwwBIm5T1YXb6UlQeAw7e+FKLIdTa/k",
    priority: "u=1, i",
    "sec-ch-ua":
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"136.0.7103.113"',
    "sec-ch-ua-full-version-list":
      '"Chromium";v="136.0.7103.113", "Google Chrome";v="136.0.7103.113", "Not.A/Brand";v="99.0.0.0"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"6.8.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-app-version": "20241129.1",
    "x-client-locale": "en_US",
    "x-client-platform": "web",
    "x-client-version": "1.2.0-sse-hint",
  },
  referrer:
    "https://chat.deepseek.com/a/chat/s/00151a7a-4531-483d-8972-ed2264afc32f",
  referrerPolicy: "strict-origin-when-cross-origin",
  body: null,
  method: "GET",
  mode: "cors",
  credentials: "include",
});

fetch(
  "https://chat.deepseek.com/a/chat/s/00151a7a-4531-483d-8972-ed2264afc32f",
  {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-arch": '"x86"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-full-version": '"136.0.7103.113"',
      "sec-ch-ua-full-version-list":
        '"Chromium";v="136.0.7103.113", "Google Chrome";v="136.0.7103.113", "Not.A/Brand";v="99.0.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua-platform-version": '"6.8.0"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    referrer: "https://accounts.google.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  },
);

// {"code":0,"msg":"","data":{"biz_code":0,"biz_msg":"","biz_data":{"chat_sessions":
// [{"id":"00151a7a-4531-483d-8972-ed2264afc32f","seq_id":1000239,
// "title":"Rendering Markdown in Svelte Options Page","title_type":"SYSTEM",
// "updated_at":1748252616.725752},{"id":"c0882f65-efd0-485f-b877-a5ed66e5d242",
// "seq_id":1000237,"title":"Install Nextcloud on Ubuntu Guide","title_type":"SYSTEM",
// "updated_at":1747733567.783078},{"id":"2abddcd7-02a8-4010-be9d-c182e0de1a00",
// "seq_id":1000219,"title":"Svelte 5 Migration Quiz and Explanations","title_type":"SYSTEM",
// "updated_at":1746382352.774889},{"id":"9d374127-e990-4099-99de-0b0b8c814435",
// "seq_id":1000211,"title":"Set nvm global default version method","title_type":"SYSTEM",
// "updated_at":1745910128.235823},{"id":"e1885c20-d5f3-4fef-8663-29f52e693c4f",
// "seq_id":1000209,"title":"Svelte 4 Limitations and Comparison Analysis",
// "title_type":"SYSTEM","updated_at":1745753959.23114},
// {"id":"0a0da5ae-c29b-4602-8718-efe115407122","seq_id":1000206,
// "title":"Process Order Delivery Function Implementation","title_type":"SYSTEM",
// "updated_at":1745664551.856212},{"id":"8f916655-bc14-4371-b0f6-ff5fc187014a","seq_id":1000178,"title":"Key Considerations for Buying a Moka Pot","title_type":"SYSTEM","updated_at":1745403450.136206},{"id":"54c47b82-167c-4029-9e09-f5632a3833a0","seq_id":1000176,"title":"Install Ubuntu on SSD, Set as Default Boot","title_type":"SYSTEM","updated_at":1745358705.655746},{"id":"3b744b74-3e91-4b64-94af-11393f0dc95d","seq_id":1000161,"title":"Svelte 5 Improves Reactivity with Explicit System","title_type":"SYSTEM","updated_at":1744816161.374897},{"id":"bfdb6c2f-be77-43c4-8581-6c081f575356","seq_id":1000155,"title":"i want to write a collaborative ","title_type":"SYSTEM","updated_at":1744788659.095415},{"id":"b3351683-ce92-48e2-95d9-1748eb2d8bfe","seq_id":1000075,"title":"Web Developer's Software Engineering Study Plan","title_type":"SYSTEM","updated_at":1741913857.569291},{"id":"73a65c96-e492-4cbd-823a-70f00c7ea8b6","seq_id":1000059,"title":"Choosing Between p5.js and Three.js for Music Visuals","title_type":"SYSTEM","updated_at":1741077874.826191}],"has_more":false}}}
fetch("https://chat.deepseek.com/api/v0/chat_session/fetch_page", {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    authorization:
      "Bearer m9an1eCMLbBon+05fMnfVGUyAiKPdCvEtWwwBIm5T1YXb6UlQeAw7e+FKLIdTa/k",
    priority: "u=1, i",
    "sec-ch-ua":
      '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"136.0.7103.113"',
    "sec-ch-ua-full-version-list":
      '"Chromium";v="136.0.7103.113", "Google Chrome";v="136.0.7103.113", "Not.A/Brand";v="99.0.0.0"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"6.8.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-app-version": "20241129.1",
    "x-client-locale": "en_US",
    "x-client-platform": "web",
    "x-client-version": "1.2.0-sse-hint",
  },
  referrer:
    "https://chat.deepseek.com/a/chat/s/00151a7a-4531-483d-8972-ed2264afc32f",
  referrerPolicy: "strict-origin-when-cross-origin",
  body: null,
  method: "GET",
  mode: "cors",
  credentials: "include",
});

// {"code":0,"msg":"","data":{"biz_code":0,"biz_msg":"","biz_data":{"chat_session":{"id":"00151a7a-4531-483d-8972-ed2264afc32f","seq_id":1000239,"agent":"chat","character":null,"title":"Rendering Markdown in Svelte Options Page","title_type":"SYSTEM","version":33,"current_message_id":33,"inserted_at":1746613836.507706,"updated_at":1748252616.725752},"chat_messages":[],"cache_valid":true,"route_id":null}}}
fetch(
  "https://chat.deepseek.com/api/v0/chat/history_messages?chat_session_id=00151a7a-4531-483d-8972-ed2264afc32f&cache_version=33",
  {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization:
        "Bearer m9an1eCMLbBon+05fMnfVGUyAiKPdCvEtWwwBIm5T1YXb6UlQeAw7e+FKLIdTa/k",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-arch": '"x86"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-full-version": '"136.0.7103.113"',
      "sec-ch-ua-full-version-list":
        '"Chromium";v="136.0.7103.113", "Google Chrome";v="136.0.7103.113", "Not.A/Brand";v="99.0.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua-platform-version": '"6.8.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-app-version": "20241129.1",
      "x-client-locale": "en_US",
      "x-client-platform": "web",
      "x-client-version": "1.2.0-sse-hint",
    },
    referrer:
      "https://chat.deepseek.com/a/chat/s/00151a7a-4531-483d-8972-ed2264afc32f",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  },
);
