var token = '501638485:AAG_WSsAYnbLjBoLXVGyhGH5P2mQOvYtqUw';

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });
var fs = require('fs');
//var firebase = require("firebase");

// Initialize Firebase
// var config = {
//   apiKey: "AIzaSyAgnrtTPh6xEzVLf7TpGAfJBVsgSmdxJ8s",
//   authDomain: "bomdiabot.firebaseapp.com",
//   databaseURL: "https://bomdiabot.firebaseio.com",
//   storageBucket: "bomdiabot.appspot.com"
// };
// firebase.initializeApp(config);
// var fbstorage = firebase.storage('gs://bomdiabot.appspot.com');
// var storageRef = storage.ref();
// var bddataRef = storageRef.child('data.json');

// Libraries
    var Dropbox         = require('dropbox');

    var DROPBOX_APP_KEY    = "frw7yuri1cmb9ar";
    var DROPBOX_APP_SECRET = "7iyz64huesd582l";
    var THE_TOKEN = 'KDvGvrJ5lu4AAAAAAAAOewS1FKVR1aXR5BU2KPH9vJ4VfRIkxHw1j0_RwjYHJf3T';


    var dbx = new Dropbox({
      key: DROPBOX_APP_KEY,
      secret: DROPBOX_APP_SECRET,
      accessToken: THE_TOKEN,
      sandbox: false
    });
    //dbx.usersGetCurrentAccount()

// IDEA: detectar pontos e utilizar eles aleatoriamente ou decididamente: "Bomdia! ..." "Bom dia, ..." "Bom dia ? ..."
// IDEA: ignorar frases com @ para não taguear pessoas, Deixar um aviso que não pode.
// IDEA: organizar como o bot será utilizado em vários grupos: arquivos diferentes ? mesclar bases de dados ?
// IDEA: json não trabalha com "" dá problema, tem que converter regex pra detectar : (.+)(')(.+)(')(.+)?

let bddata={}, newBdia, newBdiaCount=0;

console.log('bot server started...');
startRead();

function startRead(){
    //bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
  dbx.sharingGetSharedLinkFile({ url: 'https://www.dropbox.com/s/v41eatqgawwso3z/data.json' })
      .then(function (data) {
        //console.log(data);
        //console.log();
        fs.writeFileSync(data.name, data.fileBinary, 'binary', function (err) {
          if (err) { throw err; }else{
          console.log('File: ' + data.name + ' saved.');
          }
        });
        bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
        //console.log(bddata);
      })
      .catch(function (err) {
        throw err;
      });
}

bot.onText(/^\/bdcstatus$/, function (msg, match) {
  bot.sendMessage(msg.chat.id, 'Nós temos '+bddata.bomdia.length+' bom dias.').then(function () {
    // reply sent!
  });
});


bot.onText(/^\/bdcsum((\s+\d+)+)$/, function (msg, match) {
  var result = 0;
  match[1].trim().split(/\s+/).forEach(function (i) {
    result += (+i || 0);
  })
  bot.sendMessage(msg.chat.id, result).then(function () {
  });
});


bot.onText(/^(bom\s+dia+\s?)((.+)?)$/gi, function (msg, match) {
  newBdia = match[2];
  var bdiaback;
  //console.log(newBdia);

  // checa por arrobas que não podem
  var notBdiarx = /^(.+)(\@\w+)(.+)$/gi;
  var notBdia = newBdia.match(/(\@)/gi, '$1');
  //console.log(notBdia);

  // check se o bom dia foi dado corretamente
  console.log(newBdia);
  if (newBdia === '') {
    var bdiaback = "Que bom dia o quê, não é assim que damos bom dia por aqui.. É assim:  Bom dia seus adoradores de crushs inatingíveis";
  }else if(notBdia !== null){
    var bdiaback = "NOT. Just Not."+'\n'+"Nada de marcar pessoas e botar o meu na reta.";
  }else{

  // NOTE: adicionar tb para não falar os que acabou de receber
  // verifica se não foi usado recentemente e retorna o valor
  for (var i = 0; i < bddata.bomdia.length; i++) {
    var rnum = Math.floor(Math.random() * bddata.bomdia.length);
    var lbd = bddata.latebomdia.findIndex(function(str){
      if (str === bddata.bomdia[rnum]) {
        return true;
      }else{
        return false;
      }
    });
    if (lbd === -1){
      i=bddata.bomdia.length;
      bdiaback = bddata.bomdia[rnum]+'!';
      newBdiaCount +=1;
      console.log(newBdiaCount);
    }
  }

  //Armazena ultimo bom dia given e recebido
  bddata.latebomdia.shift();
  bddata.latebomdia.push(bdiaback);
  bddata.latebomdia.shift();
  bddata.latebomdia.push(newBdia);
  //console.log(bddata.latebomdia);
  }
  bot.sendMessage(msg.chat.id, 'bom dia '+bdiaback).then(function () {
    checkBdData(newBdia);
  });
});


function checkBdData(newBdia){
  // checa se o bom dia recebido já existe no banco
  var existe = bddata.bomdia.findIndex(function(elem){
    // console.log(elem, newBdia);
    if (elem === newBdia){
      return true;
    }else{
      return false;
    }
  });

  // Adiciona bom dia no banco de bom dias
  if (existe === -1) {
    bddata.bomdia.push(newBdia);
  }
  if (newBdiaCount > 10){
    saveNewdata(bddata);
    newBdiaCount=0;
  }
}

// sava arquivo json com bom dias no dropbox
function saveNewdata(bddata){
  let json = JSON.stringify(bddata, null, 2);
  dbx.filesUpload({ path: '/data.json', contents: json, mode:'overwrite' })
    .then(function (response) {
      console.log('Data Saved.');
      startRead();
    })
    .catch(function (err) {
      console.log('Error: ', err);
    });
}
