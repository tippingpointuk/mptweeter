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
  var body = await request.json()
  console.log( JSON.stringify( body ) )
  if (body.tweets){
    var numberOfTweets = parseInt(body.tweets);
  }else{
    var numberOfTweets = 3;
  }

  // Get MPs
  var offset = true
  var baseurl = `https://api.airtable.com/v0/appdNlKCQlU1CczEx/tblb0Vnvs9Hunt77b?view=${ body.mpView }&fields%5B%5D=display_name&fields%5B%5D=twitter_username`
  var airtableHeaders = {
    "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
    "content-type": "application/json;charset=UTF-8",
  }
  var resJson = {};
  var mps = [];
  var url = baseurl;
  while (offset){
    console.log(url)
    const res = await fetch(url, {headers:airtableHeaders});
    var resJson = await res.json();
    console.log(JSON.stringify(resJson))
    mps = mps.concat(resJson.records);
    if (resJson.offset){
      var url = `${baseurl}&offset=${resJson.offset}`;
    }else{
      offset = false;
    }
  }
  // console.log(mps.length )
  // Get Tweets
  var offset = true
  var baseurl = `https://api.airtable.com/v0/app1cmhkrHR6nGWUn/tblPq2RGZk7DlciMj?view=${ body.tweetView }`
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
  // console.log( JSON.stringify(tweets) )
  var generatedTweets = {"tweets": []};
  for (var i =0; i<numberOfTweets;i++){
    // Get random tweet
    var tweet = tweets[Math.floor(Math.random() * tweets.length)];
    var noMps = (tweet.fields["Text"].match(/INSERTMP/g) || []).length
    // console.log(noMps)
    // Get random MP
    var newTweet = {
      'text': tweet.fields["Text"],
      'link': tweet.fields["Link"],
      'ctt' : tweet.fields["ClickToTweet"]['url']
    }
    for (var mpi = 0;mpi<noMps;mpi++){
      var mp = mps[Math.floor(Math.random() * mps.length)];
      console.log(JSON.stringify(mp))
      Object.keys(newTweet).forEach(key => {
        if (newTweet[key]){
          if (mp.fields.twitter_username){
            newTweet[key] = newTweet[key].replace(INSERT_MP,mp.fields.twitter_username);
          }
        }

      })
      newTweet.html = generateHtmlTweet(newTweet);
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

const generateHtmlTweet = function(tweet){
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
    tweetText += `<span class='url' >${ tweet.link }</span>`
  }
  var tweet =  `
    <div class=tweet>
      <a target="_blank" href="${ tweet.ctt }">
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
    return `<span class="${spanClass}">${word}</span>`;
  }else{
    return word;
  }
}
