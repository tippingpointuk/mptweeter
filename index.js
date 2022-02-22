// var Airtable = require("airtable");
const INSERT_TARGET = "INSERTTARGET"
const INSERT_TARGET_REGEX = /INSERTTARGET/g

const AIRTABLE_CONFIG = {
    "targets":{
      "base": "appgY3TFV53N67C9w",
      "table": "tbl0KFPvcwxHadJMl"
    },
    "tweets":{
      "base": "appgY3TFV53N67C9w",
      "table": "tbl4cJt1tIjk4DY1s"
    }
  };

console.log(AIRTABLE_CONFIG.targets.base)



addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  console.log(AIRTABLE_CONFIG.targets)
  var path = request.url.split("//")[1].split("/");
  var body = await request.json()
  console.log( JSON.stringify( body ) )
  if (body.tweets){
    var numberOfTweets = parseInt(body.tweets);
  }else{
    var numberOfTweets = 3;
  }

  // Get MPs
  var offset = true
  var baseurl = `https://api.airtable.com/v0/${ AIRTABLE_CONFIG.targets.base }/${AIRTABLE_CONFIG.targets.table}?view=${body.mpView}&fields%5B%5D=Name&fields%5B%5D=Twitter`
  let targetRequestBody = {
    view: body.mpView,
    fields: [
      "Name",
      "Twitter"
    ]
  }
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
  var baseurl = `https://api.airtable.com/v0/${ AIRTABLE_CONFIG.tweets.base }/${AIRTABLE_CONFIG.tweets.table}?view=${ body.tweetView }`
  resJson = {};
  var tweets = [];
  url = baseurl;
  console.log(url)
  while (offset){
    const res = await fetch(url, {headers:airtableHeaders});
    resJson = await res.json();
    console.log(JSON.stringify(resJson))
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
    var noMps = (tweet.fields["Text"].match(INSERT_TARGET_REGEX) || []).length
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
          if (mp.fields.Twitter){
            newTweet[key] = newTweet[key].replace(INSERT_TARGET,mp.fields.Twitter);
          }
        }

      })
      newTweet.mp = mp.fields;
      newTweet.html = await generateHtmlTweet(newTweet);
      // console.log(newTweet.html)
    }
    // console.log(JSON.stringify(newTweet))
    generatedTweets.tweets.push(newTweet)
  }

  return new Response(JSON.stringify(generatedTweets), {
    headers: {
      'content-type': 'application/json',
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
  var tweet =  /*html*/`
    <div class=tweet>
      <a target="_blank" href="${ tweet.ctt }" >
        ${ tweetText }
      </a>
    </div>
  `;
  return tweet;
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
