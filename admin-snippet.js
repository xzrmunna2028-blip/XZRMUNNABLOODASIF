/* admin.html-এ রিয়েল টাইম কাউন্ট দেখানোর উদাহরণ (আপনার admin.html-এ যেখানে Firebase db আছে সেখানে বসান)।
   ধরে নেওয়া হচ্ছে db = getDatabase(app) আর onValue, ref ইমপোর্ট করা আছে। */
onValue(ref(db, "users"), (s) => {
  const total = s.exists() ? Object.keys(s.val()).length : 0;      // মোট অ্যাকাউন্ট
  document.getElementById("cntUsers").textContent = total;
});
onValue(ref(db, "push_subs"), (s) => {
  const all = s.exists() ? Object.values(s.val()) : [];
  const on = all.filter((x) => x.optedIn === true).length;          // পুশ সাবস্ক্রাইবার
  document.getElementById("cntPush").textContent = on;
  document.getElementById("cntNoPush").textContent = all.length - on; // অ্যাকাউন্ট আছে কিন্তু Allow দেননি
});
/* পুশ পাঠানো (আগের মতোই): push(ref(db, "push_queue"), { title, body, url: "https://আপনার-সাইট" , ts: Date.now() })
   তারপর push_queue/<id>/done === true হলে পাঠানো হয়েছে, false হলে error ফিল্ড দেখুন। */
