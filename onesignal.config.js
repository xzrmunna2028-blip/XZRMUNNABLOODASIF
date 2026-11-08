/* OneSignal সেটিংস, সার্ভারের (Cloud Functions) জন্য। এই ফাইল ওয়েবসাইটে যায় না, শুধু `firebase deploy --only functions`-এর সময় ব্যবহার হয়।
   পরে API Key বদলাতে চাইলে শুধু নিচের REST_API_KEY-তে বসান, আর কোথাও কিছু বদলাতে হবে না।
   সতর্কতা: এই ফাইল GitHub-এ বা পাবলিক জায়গায় আপলোড করবেন না। */
module.exports = {
  APP_ID: "" /* TODO: ক্লায়েন্টের OneSignal App ID */,
  // OneSignal → Settings → Keys & IDs → REST API Key (সাধারণত "os_v2_app_..." দিয়ে শুরু)
  REST_API_KEY: "",
  // পাবলিক কী (ইউজার ভেরিফিকেশন চালু করলে লাগবে)
  PUBLIC_KEY: "" /* ক্লায়েন্টের নিজের কী, না লাগলে ফাঁকা */,
};
