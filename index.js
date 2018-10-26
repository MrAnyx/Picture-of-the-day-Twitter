const tokens = require('./tokens.json')
const https = require('https')
const fs = require('fs')
const request = require('request');
var Twitter = require('twitter')

var client = new Twitter({
  consumer_key: tokens.consumer_key,
  consumer_secret: tokens.consumer_secret,
  access_token_key: tokens.access_token,
  access_token_secret: tokens.access_token_secret
});

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function tweet_apod(){
  try{
  https.get("https://api.nasa.gov/planetary/apod?api_key="+tokens.nasa_api, (resp) =>{
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      let apod = JSON.parse(data)
      download(apod.url, 'image_apod.jpg', function(){
        console.log(`L'image du ${apod.date} a été téléchargée avec succès`);
        var image = fs.readFileSync("image_apod.jpg");
        client.post('media/upload', {media: image}, function(error, media, response) {
          if (!error) {
            var status = {
              status: `The picture of the day (${apod.date}) : "${apod.title}" taken by ${apod.copyright}.\n\n#space #nasa #esa #apod #astrophoto\n\nFor more information, check out the @NASA website : https://apod.nasa.gov/apod/archivepix.html`,
              media_ids: media.media_id_string // Pass the media id string
            }
            client.post('statuses/update', status, function(){
              console.log(`L'image du ${apod.date} a été tweeté avec succès`);
            });
          }
        });
      })
    });
  })
} catch(e){
  console.log(e);
}

}

tweet_apod()
setInterval(tweet_apod, 1000*60*60*24)
