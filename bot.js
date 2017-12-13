var token = '501638485:AAG_WSsAYnbLjBoLXVGyhGH5P2mQOvYtqUw';

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });
var fs = require('fs');

let bddata={}, newBdia, latebomdia=[' ', ' ', ' ', ' ', ' '];
//= {   "bomdia": []};

console.log('bot server started...');
startRead();

function startRead(){
    bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
    console.log('Data Read : '+bddata.bomdia.length+' bom dias.');
    console.log(bddata);
}


bot.onText(/^\/bdcstatus (.+)$/, function (msg, match) {
  var name = match[1];
  bot.sendMessage(msg.chat.id, 'Então '+name+' nós temos '+bddata.bomdia.length+' bom dias.').then(function () {
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

//console.log(bddata);
// var rnum = Math.floor(Math.random() * bddata.bomdia.length);
// console.log(rnum);

bot.onText(/^^(bom\sdia\s)((.+))$/, function (msg, match) {
  newBdia = match[2];
  var bdiaback;
  // verifica se já existe no banco
  console.log(newBdia);
  // var existe = bddata.bomdia.find(function(str){
  //   if (str === newBdia) {
  //     console.log('Bom dia existente');
  //     return false;
  //   }
  // });
  // verifica se já existe nos recentes
  // var existe2 = newbddata.find(function(str){
  //   if (str === newBdia) {
  //     console.log('Bom dia existente');
  //     return false;
  //   }
  // });
  //console.log(existe, existe2);
  // insere no banco de novos
  // if (existe===undefined) {
  //   newbddata.push(newBdia);
  // }
  //console.log(newbddata);
  // adiciona no banco de recentes
  // verifica se não foi usado recentemente e retorna o valor
  for (var i = 0; i < bddata.bomdia.length; i++) {
    var rnum = Math.floor(Math.random() * bddata.bomdia.length);
    var lbd = latebomdia.findIndex(function(str){
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
  latebomdia.shift();
  latebomdia.push(bdiaback);
  console.log(latebomdia);


  bot.sendMessage(msg.chat.id, 'bom dia '+bdiaback+'!').then(function () {
    // reply sent!
    checkBdData(newBdia);
  });
});

function checkBdData(newBdia){
    //setInterval(function(){
      //if (newbddata.length > 0) {
        //fs.readFile('data.json', 'utf8', function readCheckFileCallback(err, data){
          var oldData = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
          console.log(oldData.bomdia.length);
          //if (oldData.bomdia.length < (bddata.bomdia.length + newbddata.length)) {

          var existe = bddata.bomdia.findIndex(function(elem){
            //console.log(elem, newBdia);
            if (elem === newBdia){
            //  console.log('Bom dia existente.');
              return true;
            }else{
            //  console.log('não existe');
              return false;
            }
          });
          console.log(existe);
          if (existe === -1) {
            oldData.bomdia.push(newBdia);
            bddata.bomdia.push(newBdia);
          }
            // for (var i = 0; i < bddata.bomdia.length; i++) {
            //   if (bddata.bomdia[i]!==newBdia) {
            //
            //   }
            //
            // }
            //newbddata =[];
          //}
        //});
        saveNewdata(bddata);
      //}
  //  },60000 * 180);
}



function saveNewdata(bddata){
  //fs.readFile('data.json', 'utf8', function readSaveFileCallback(err, data){
      //if (err){
      //    console.log(err);
    //  } else {
      //var tempbddata = JSON.parse(data); //now it an object
      //bddata.bomdia.push({id: 2, square:3}); //add some data
      let json = JSON.stringify(bddata, null, 2);
      //var json = JSON.stringify(bddata); //convert it back to json
      fs.writeFileSync('data.json', json, 'utf8');
  //}});
}
