// var Airtable = require("airtable");
const INSERT_TARGET = "INSERTTARGET"
const INSERT_TARGET_REGEX = /INSERTTARGET/g

const AIRTABLE_CONFIG = {
  silvertown:   {
    "dynamic":{
      "string": "INSERTTARGET",
      "regex": /INSERTTARGET/g
    },
    "targets":{
      "base": "appgY3TFV53N67C9w",
      "table": "tbl0KFPvcwxHadJMl",
      "fields":{
        "name": "Name",
        "twitter":"Twitter"
      }
    },
    "tweets":{
      "base": "appgY3TFV53N67C9w",
      "table": "tbl4cJt1tIjk4DY1s"
    }
  },
  stopcambo: {
    "dynamic":{
      "string": "INSERTMP",
      "regex": /INSERTMP/g
    },
    "targets":{
      "base": "appdNlKCQlU1CczEx",
      "table": "tblb0Vnvs9Hunt77b",
      "fields":{
        "name": "display_name",
        "twitter":"twitter_username"
      }
    },
    "tweets":{
      "base": "app1cmhkrHR6nGWUn",
      "table": "tblPq2RGZk7DlciMj"
    }
  }
};



addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  var path = request.url.split("//")[1].split("/");
  var group = path[1] || 'stopcambo'
  let config = Object.keys(AIRTABLE_CONFIG).includes(group) ? AIRTABLE_CONFIG[group] : AIRTABLE_CONFIG.stopcambo;
  console.log(`Getting tweets for ${group}`)
  console.log(JSON.stringify(config))
  var body = await request.json()
  // console.log( JSON.stringify( body ) )
  var numberOfTweets = body.tweets ? parseInt(body.tweets) : 3;

  // Get MPs
  var offset = true
  var baseurl = `https://api.airtable.com/v0/${ config.targets.base }/${config.targets.table}?view=${body.mpView}&fields%5B%5D=${encodeURIComponent(config.targets.fields.name)}&fields%5B%5D=${encodeURIComponent(config.targets.fields.twitter)}`
  var airtableHeaders = {
    "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
    "content-type": "application/json;charset=UTF-8",
  }
  let resJson = {};
  let mps = [];
  let url = baseurl;
  while (offset){
    console.log(url)
    const res = await fetch(url, {
      headers: airtableHeaders
    });
    resJson = await res.json();
    console.log(JSON.stringify(resJson))
    mps = mps.concat(resJson.records);
    if (resJson.offset){
      url = `${baseurl}&offset=${resJson.offset}`;
    }else{
      offset = false;
    }
  }
  // console.log(mps.length )
  // Get Tweets
  var offset = true
  var baseurl = `https://api.airtable.com/v0/${ config.tweets.base }/${config.tweets.table}?view=${ body.tweetView }`
  resJson = {};
  var tweets = [];
  url = baseurl;
  console.log(url)
  while (offset){
    const res = await fetch(url, {headers:airtableHeaders});
    resJson = await res.json();
    // console.log(JSON.stringify(resJson))
    tweets = tweets.concat(resJson.records);
    if (resJson.offset){
      url = `${baseurl}&offset=${resJson.offset}`;
    }else{
      offset = false;
    }
  }
  // console.log( JSON.stringify(tweets) )
  var generatedTweets = {"tweets": []};
  for (var i =0; i<numberOfTweets;i++){
    // Get random tweet
    var tweet = tweets[Math.floor(Math.random() * tweets.length)];
    var noMps = (tweet.fields["Text"].match(config.dynamic.regex) || []).length
    // console.log(noMps)
    // Get random MP
    var newTweet = {
      'text': tweet.fields["Text"],
      'link': Object.keys(tweet.fields).includes("Link") ? tweet.fields["Link"] : "",
      'ctt' : tweet.fields["ClickToTweet"]['url']
    }
    for (var mpi = 0;mpi<noMps;mpi++){
      var mp = mps[Math.floor(Math.random() * mps.length)];
      console.log(JSON.stringify(mp))
      Object.keys(newTweet).forEach(key => {
        if (newTweet[key]){
          // Replace INSERTMP for
          if (mp.fields[config.targets.fields.twitter]){
            console.log(config.dynamic.string)
            newTweet[key] = newTweet[key].replace(config.dynamic.string,mp.fields[config.targets.fields.twitter]);
          }
        }

      })
      newTweet.target = mp.fields;
      newTweet.html = await generateHtmlTweet(newTweet);
      // console.log(newTweet.html)
    }
    // console.log(JSON.stringify(newTweet))
    generatedTweets.tweets.push(newTweet)
  }

  return new Response(JSON.stringify(generatedTweets), {
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers")
    },
  })
}

const generateHtmlTweet = async function(tweet){
  // Got through each work and add <span>s for hashtags etc
  var tweetByWord = tweet.text.split(' ');
  var tweetByLine = tweet.text.split('\n');
  var tweetByWordProcessed = [];
  for (var l in tweetByLine){
    var lineByWord = tweetByLine[l].split(' ');
    for (var w in lineByWord){
      var word = lineByWord[w];
      tweetByWordProcessed.push(processWord(word));
    }
    tweetByWordProcessed.push('<br>')
  }
  // console.log(JSON.stringify(tweetByWordProcessed))
  tweetText = tweetByWordProcessed.join(' ').replace("\n", "");
  if (tweet.link){
    tweetText += /*html*/`<span class='url' >${ tweet.link }</span>`
  }
  return /*html*/`
    <div class=tweet>
      <a target="_blank" href="${ tweet.ctt }" data-tweet="${ JSON.stringify(tweet) }">
        ${ tweetText }
      </a>
    </div>
  `;
}
const processWord = (word) => {
  var spanClass = null;
  if (word[0] == "#"){
    spanClass = "hashtag";
  }else if (word[0] == "@"){
    spanClass = "at";
  }else if (word.includes("://")){
    spanClass = "url";
  }
  if (spanClass){
    return /*html*/`<span class="${spanClass}">${word}</span>`;
  }else{
    return word;
  }
}
