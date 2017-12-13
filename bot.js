var token = '501638485:AAG_WSsAYnbLjBoLXVGyhGH5P2mQOvYtqUw';

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });
var fs = require('fs');

let bddata={}, newBdia;
//, latebomdia=[' ', ' ', ' ', ' ', ' ']

console.log('bot server started...');
startRead();

function startRead(){
    bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
    console.log('Data Read : '+bddata.bomdia.length+' bom dias.');
    //console.log(bddata);
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
    // reply sent!
  });
});


// bot.onText(/^(bom\s+dia+\s?)/gi, function (msg, match) {
//   var mat = match[2];
//   var mat1 = match[1];
//   console.log(mat);
//   if (mat !== undefined) {
//     var result = "Que bom dia o quê, não é assim que damos bom dia por aqui.."+'\n'+"É assim:  Bom dia seus adoradores de crushs inatingíveis";
//   }else{
//     return;
//   }
//   bot.sendMessage(msg.chat.id, result).then(function () {
//     // reply sent!
//   });
// });


bot.onText(/^(bom\s+dia+\s?)((.+)?)$/gi, function (msg, match) {
  newBdia = match[2];
  var bdiaback;
  //console.log(newBdia);

  // check se o bom dia foi dado corretamente
  console.log(newBdia, match[2]);
  if (newBdia === '') {
    var bdiaback = "Que bom dia o quê, não é assim que damos bom dia por aqui.. É assim:  Bom dia seus adoradores de crushs inatingíveis";
  }else{

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
        bdiaback = bddata.bomdia[rnum];
      }
    }

    //Armazena ultimo bom dia given
    bddata.latebomdia.shift();
    bddata.latebomdia.push(bdiaback);
    //console.log(latebomdia);
  }
  bot.sendMessage(msg.chat.id, 'bom dia '+bdiaback+'!').then(function () {
    // reply sent!
    checkBdData(newBdia);
  });
});


function checkBdData(newBdia){
  // lê o arquivo de bom dias
  var oldData = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
  //console.log(oldData.bomdia.length);

  // checa se o bom dia recebido já existe no banco
  var existe = bddata.bomdia.findIndex(function(elem){
    // console.log(elem, newBdia);
    if (elem === newBdia){
    // console.log('Bom dia existente.');
      return true;
    }else{
    // console.log('não existe');
      return false;
    }
  });
  //console.log(existe);
  // Adiciona bom dia no banco de bom dias
  if (existe === -1) {
    //oldData.bomdia.push(newBdia);
    bddata.bomdia.push(newBdia);
  }
saveNewdata(bddata);
}


// sava arquivo json com bom dias
function saveNewdata(bddata){
      let json = JSON.stringify(bddata, null, 2);
      fs.writeFileSync('data.json', json, 'utf8');
}
