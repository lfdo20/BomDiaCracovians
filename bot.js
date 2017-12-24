var fs = require('fs');

// Telegram api config
  var token = 'Bot_Token';
  var Bot = require('node-telegram-bot-api'),
      bot = new Bot(token, { polling: true });


// Dropbox Config
  var Dropbox         = require('dropbox');
  var DROPBOX_APP_KEY    = "drop_app_key";
  var DROPBOX_APP_SECRET = "drop_app_secret"; 
  var THE_TOKEN = 'dropbox_token';

  var dbx = new Dropbox({
    key: DROPBOX_APP_KEY,
    secret: DROPBOX_APP_SECRET,
    accessToken: THE_TOKEN,
    sandbox: false
  });


// Seção de Notas
  // IDEA: detectar pontos e utilizar eles aleatoriamente ou decididamente: "Bomdia! ..." "Bom dia, ..." "Bom dia ? ..."
  // IDEA: ignorar frases com @ para não taguear pessoas, Deixar um aviso que não pode.
  // IDEA: organizar como o bot será utilizado em vários grupos: arquivos diferentes ? mesclar bases de dados ?
  // IDEA: json não trabalha com "" dá problema, tem que converter regex pra detectar : (.+)(')(.+)(')(.+)?

// Global Var
  let bddata={}, newBdia, newbdv, newptv, newBdiaCount=0;

console.log('bot server started...');
startRead();

// pega o arquivo no dropbox e transforma em objeto
  function startRead(){
      //bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
    dbx.sharingGetSharedLinkFile({ url: 'https://www.dropbox.com/s/v41eatqgawwso3z/data.json' })
        .then(function (data) {
          //console.log(data);
          fs.writeFileSync(data.name, data.fileBinary, 'binary', function (err) {
            if (err) { throw err; }else{
            console.log('File: ' + data.name + ' saved.');
            }
          });
          bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
        })
        .catch(function (err) {
          throw err;
        });
  }

// comando para help
  bot.onText(/^\/bdchelp$|^\/bdchelp@bomdiacracobot$/, function (msg, match) {
    var text =
    "Bom dia!" +"\n"+
    "Eu guardo toda a frase dita após 'bom dia'" +"\n"+
    "E respondo todos os bom dias com ou sem frases.." +"\n"+
    'mas ainda não entendo coisas loucas tipo "buónday".' +"\n"+
    "\n"+
    "\\bdcstatus - para ver a quantidades de bom dias no banco." +"\n"+
    "\\bdcultimos - para ver os ultimos bom dias adicionados" +"\n"+
    "\\bdcsum - para... somar ..." +"\n";


    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// comando para help
  bot.onText(/^\/bdcultimos$|^\/bdcultimos@bomdiacracobot$/, function (msg, match) {
    var text='';
    for (var i = 0; i < bddata.latebdreceived.length; i++) {
      text += bddata.latebdreceived[i]+"\n";
    }

    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// comando para verificar bom dias
  bot.onText(/^\/bdcstatus$|^\/bdcstatus@bomdiacracobot$/, function (msg, match) {
    bot.sendMessage(msg.chat.id, 'Nós temos '+bddata.bomdia.length+' bom dias.').then(function () {
      // reply sent!
    });
  });

// comando para fazer somas, pra q? num sei..
  bot.onText(/^\/bdcsum((\s+\d+)+)$|^\/bdcsum@bomdiacracobot((\s+\d+)+)$/, function (msg, match) {
    var result = 0;
    match[1].trim().split(/\s+/).forEach(function (i) {
      result += (+i || 0);
    })
    bot.sendMessage(msg.chat.id, result).then(function () {
    });
  });

// listen de bom dias
///^(bom\s+dia+\s?)((.+)?)$/gi
  var bdrx = /^((b(\w)+)(\s?)(d\w+))(\s?|\.+|,|!)?(\s)?(.+)?$/gi;
  bot.onText(bdrx, function (msg, match) {
    newbdv = match[1];
    newptv = match[6];
    newBdia = match[8];
    var bdiaback;
    console.log(newBdia);
    // checa por arrobas que não podem
    if (newBdia !== undefined) {
      var notBdia = newBdia.match(/(\@)/gi, '$1');
    }
    // check se o bom dia foi dado corretamente

    if (newBdia === undefined) {
      newBomDia();
      saveLastSay();
      // var bdiaback = "Que bom dia o quê, não é assim que damos bom dia por aqui.. É assim:  Bom dia seus adoradores de crushs inatingíveis";
    }else if(notBdia !== null){
      var bdiaback = "NOT. Just Not."+'\n'+"Nada de marcar pessoas e botar o meu na reta.";
    }else{
      newBomDia();
      saveLastSay();
      saveLastListen();
    }

    // Gera um bom dia ramdom do banco e vê se não é igual aos últimos falados.
    function newBomDia(){
      for (var i = 0; i < bddata.bomdia.length; i++) {
        var bdnum = Math.floor(Math.random() * bddata.bomdia.length);
        var bdvnum = Math.floor(Math.random() * bddata.bdiasvar.length);
        var ptvnum = Math.floor(Math.random() * bddata.pontosvar.length);
        var lbds = bddata.latebdsay.findIndex(function(str){
          if (str === bddata.bomdia[bdnum]) {
            return true;
          }else{
            return false;
          }
        });
        var lbdr = bddata.latebdreceived.findIndex(function(str){
          if (str === bddata.bomdia[bdnum]) {
            return true;
          }else{
            return false;
          }
        });
        if (lbds === -1 && lbdr === -1){
          i=bddata.bomdia.length;
          bdiaback = bddata.bdiasvar[bdvnum] + bddata.pontosvar[ptvnum] + bddata.bomdia[bdnum];
        }
      }
    }

    //Armazena ultimo bom dia falado
    function saveLastSay(){
      bddata.latebdsay.shift();
      bddata.latebdsay.push(bdiaback);
    }

    //Armazena ultimo bom dia recebido
    function saveLastListen(){
      bddata.latebdreceived.shift();
      bddata.latebdreceived.push(newBdia);
      //console.log(bddata.latebomdia);
      checkBdData(newBdia);
      checkBdvData(newbdv);
    }

    bot.sendMessage(msg.chat.id, bdiaback).then(function () {
    });
  });

// checa se a frase de bom dia recebido já existe no banco
  function checkBdData(newBdia){
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
      newBdiaCount +=1;
      console.log(newBdiaCount);
    }
    if (newBdiaCount > 10){
      saveNewdata(bddata);
      newBdiaCount=0;
    }
  }

// checa se a variação de bom dia recebido já existe no banco
  function checkBdvData(newbdv){
    var existe = bddata.bdiasvar.findIndex(function(elem){
      // console.log(elem, newBdia);
      if (elem === newbdv){
        return true;
      }else{
        return false;
      }
    });

    // Adiciona bom dia no banco de bom dias
    if (existe === -1) {
      bddata.bdiasvar.push(newbdv);
      newBdiaCount +=1;
      console.log(newBdiaCount);
    }
    if (newBdiaCount > 10){
      saveNewdata(bddata);
      newBdiaCount=0;
    }
  }

// sava arquivo json com bom dias no dropbox a cada 10 novos
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
