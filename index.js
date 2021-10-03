// var Airtable = require("airtable");
const INSERT_MP = "INSERTMP"


addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  var path = request.url.split("//")[1].split("/");
  // if (path.length <= 2){
  //   path = []
  // }else{
  //   path.shift();
  // }
  try {
    var numberOfTweets = parseInt(path[1])
  } catch (e) {
    console.log(e)
    var numberOfTweets = 3;
  }
  console.log(path)
  console.log(numberOfTweets)

  // Get MPs
  var offset = true
  var baseurl = "https://api.airtable.com/v0/appdNlKCQlU1CczEx/tblb0Vnvs9Hunt77b?view=viwmvRNLuTByBvMnV&fields%5B%5D=display_name&fields%5B%5D=twitter_username"
  var airtableHeaders = {
    "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
    "content-type": "application/json;charset=UTF-8",
  }
  var resJson = {};
  var mps = [];
  var url = baseurl;
  while (offset){
    const res = await fetch(url, {headers:airtableHeaders});
    var resJson = await res.json();
    // console.log(JSON.stringify(resJson.records))
    mps = mps.concat(resJson.records);
    if (resJson.offset){
      var url = `${baseurl}&offset=${resJson.offset}`;
    }else{
      offset = false;
    }
  }
  console.log(mps.length )
  // Get Tweets
  var offset = true
  var baseurl = "https://api.airtable.com/v0/app1cmhkrHR6nGWUn/tblPq2RGZk7DlciMj?view=viwypQZddK7OJOQpU"
  var resJson = {};
  var tweets = [];
  var url = baseurl;
  while (offset){
    const res = await fetch(url, {headers:airtableHeaders});
    var resJson = await res.json();
    // console.log(JSON.stringify(resJson.records))
    tweets = tweets.concat(resJson.records);
    if (resJson.offset){
      var url = `${baseurl}&offset=${resJson.offset}`;
    }else{
      offset = false;
    }
  }
  console.log( JSON.stringify(tweets) )
  var generatedTweets = {"tweets": []};
  for (var i =0; i<=numberOfTweets;i++){
    // Get random tweet
    var tweet = tweets[Math.floor(Math.random() * tweets.length)];
    // Get random MP
    var mp = mps[Math.floor(Math.random() * mps.length)];
    console.log(mp.fields)
    var newTweet = {
      'text': tweet.fields["Text"].replace(INSERT_MP,mp.fields.twitter_username),
      'link': tweet.fields["Link"].replace(INSERT_MP,mp.fields.twitter_username),
      'ctt': tweet.fields["ClickToTweet"]['url'].replace(INSERT_MP,mp.fields.twitter_username)
    }
    console.log(JSON.stringify(newTweet))
    generatedTweets.tweets.push(newTweet)
  }

  return new Response(JSON.stringify(generatedTweets), {
    headers: { 'content-type': 'application/json' },
  })
}