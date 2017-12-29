var fs = require('fs');
var moment = require('moment');

// Telegram api config
  var token = '501638485:AAG_WSsAYnbLjBoLXVGyhGH5P2mQOvYtqUw';
  var Bot = require('node-telegram-bot-api'),
      bot = new Bot(token, { polling: true });

// Global Var
  let bddata={}, newBdia, newbdv, newptv, newBdiaCount=0, newgifCount=0;
  let dropfilesurl = [['https://www.dropbox.com/s/v41eatqgawwso3z/data.json','data.json','bddata'],['https://www.dropbox.com/s/1xpbz9xhrho6bzy/gifdata.json','gifdata.json', 'gifdata']];
  let gifdata={
    'newgif':[],
    'ckdgif':[]
  };
  var nowDay = moment().format('ddd');

// Dropbox Config
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

// Seção de Notas
  // IDEA: detectar pontos e utilizar eles aleatoriamente ou decididamente: "Bomdia! ..." "Bom dia, ..." "Bom dia ? ..."
  // IDEA: ignorar frases com @ para não taguear pessoas, Deixar um aviso que não pode.
  // IDEA: organizar como o bot será utilizado em vários grupos: arquivos diferentes ? mesclar bases de dados ?
  // IDEA: json não trabalha com "" dá problema, tem que converter regex pra detectar : (.+)(')(.+)(')(.+)?

console.log('bot server started...');
startRead();

// pega o arquivo no dropbox e transforma em objeto
  function startRead(){
      //bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
    for (let id of dropfilesurl) {
      //console.log(id[2]);
      dbx.sharingGetSharedLinkFile({ url: id[0] })
          .then(function (data) {
            //console.log(id[0], data);
            fs.writeFileSync(data.name, data.fileBinary, 'binary', function (err) {
              if (err) { throw err; }else{
              //console.log('File: ' + data.name + ' saved.');
              }
            });
            if (id[2] === 'bddata') {
                bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
            }else if (id[2] === 'gifdata'){
                gifdata = JSON.parse(require('fs').readFileSync('gifdata.json', 'utf8'));
            }
          })
          .catch(function (err) {
            throw err;
          });
    }
  }

// comando para iamgem do dia
  bot.onText(/^\/bdcdia$|^\/bdcdia@bomdiacracobot$/, function (msg, match) {
    var text='https://www.dropbox.com/s/77byqxoowpns5yl/bdcdia.jpg?raw=1';
    bot.sendPhoto(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// comando para ultimos recebidos
  bot.onText(/^\/bdcultimos$|^\/bdcultimos@bomdiacracobot$/, function (msg, match) {
    var text='';
    for (var i = 0; i < bddata.latebdreceived.length; i++) {
      text += bddata.latebdreceived[i]+"\n";
    }
    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

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

// Recebimento de gifs putaria
  bot.on('document', (msg) => {
    //nowDay === 'Fri' &&
    if (msg.document.mime_type === 'video/mp4') {
      var newGf =msg.document.file_id;
      checkBdData(gifdata.newgif, newGf);
    }
  });

// comando para putarias
  var gftagrx = /^(putaria)$/gi;
  bot.onText(gftagrx, function (msg, match) {
    var gifnum = Math.floor(Math.random() * gifdata.newgif.length);
    var gfid = gifdata.newgif[gifnum];
    bot.sendDocument(msg.chat.id, gfid).then(function () {
    });
  });

// tumblr rssgif links scrapper
///(\<img src\=\")(h\S+gif(?!\"\/\<br))("\/\>)/gi

// comando para Hoje é dia quê
    var hjmessage, hjdiarx = /^(\w+(?=\s)\s)?((hoje|hj)|(que|q))?(.{3}|.)?((dia)|(hoje|hj)|(que|q))(.{4}|.{3})((dia)|(hoje|hj)|(que|q))$/gi;
    bot.onText(hjdiarx, function (msg, match) {
      var tp1 = match[6]; //dia
      var tp2 = match[11] // q que ou hoje
      console.log(tp1, tp2 );
      if (tp1==='dia' && tp2.match(/^(q|que|hoje|hj)$/)) {
        switch (nowDay) {
          case 'Sun':
            hjmessage =
            "🍰🍷 DOMINGO MIÇANGUEIRO CREATIVO DA POHRA 🎨"+"\n"+
            "Pornfood e artes"+"\n"+
            "(desenhos, textos, fotos de paisagens, pets, etc)"+"\n"+
            +" "+"\n";
            break;
          case 'Mon':
            hjmessage =
            "🎧segunda feira spatifou🎤"+"\n"+
            "Músicas, artistas, playlists e karaoke"+"\n"+
            " "+"\n";
            break;
          case 'Tue':
            hjmessage =
            "📷terça feira ególatra💆"+"\n"+
            "Egoshot, histórias pessoais e desabafos"+"\n"+
            " "+"\n";
            break;
          case 'Wed':
            hjmessage =
            "😂quarta feira gozada👌"+"\n"+
            "Piadas, twits, prints..."+"\n"+
            " "+"\n";
            break;
          case 'Thu':
            hjmessage =
            "📢 QUINTA FEIRA RADIO DE INTERNETE 📻"+"\n"+
            "Episódios de podcast pra indicar, lolicast e audiozaços..."+"\n"+
            " "+"\n";
            break;
          case 'Fri':
            hjmessage =
            "🍆 sEXTA XERA SEN REGRAS 💦"+"\n"+
            "De dia: Cracolês e tretas (ou não)"+"\n"+
            "De noite: Nudeshot e putaria (ou sim)"+"\n"+
            " "+"\n";
            break;
          case 'Sat':
            hjmessage =
            "🎮 QUAL É A BOA / BOSTA DE SÁBADO ? 🎥"+"\n"+
            "(des) indicações pro fim de semana"+"\n"+
            " "+"\n";
            break;
        }
        bot.sendMessage(msg.chat.id, hjmessage).then(function () {
        });
      }
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
// /^(bom\s+dia+\s?)((.+)?)$/gi
// /^(((bo|bu)(\w+)?)(\s?)((di|de|dj)\w+))(\s?|\.+|,|!)?(\s)?(.+)?$/gi
// /^((b(\w)+)(\s?)(d\w+))(\s?|\.+|,|!)?(\s)?(.+)?$/gi
  var bdrx = /^(((bo|bu)(\w+)?)(\s?)((di|de|dj)\w+))(\s?|\.+|,|!)?(\s)?(.+)?$/gi;
  bot.onText(bdrx, function (msg, match) {
    newbdv = match[1];
    newptv = match[8];
    newBdia = match[10];
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
    }else if(notBdia !== null){
      var bdiaback = "NOT. Just Not."+'\n'+"Nada de marcar pessoas e botar o meu na reta.";
    }else{
      newBomDia();
      saveLastSay();
      saveLastListen();
    }

// Gera um bom dia ramdom do banco e checa com os últimos falados.
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
      checkBdData(bddata.bomdia, newBdia);
      checkBdvData(newbdv);
    }

    bot.sendMessage(msg.chat.id, bdiaback).then(function () {
    });
  });

// checa se a frase de bom dia recebido já existe no banco
  function checkBdData(path, newBdia){
    //console.log(path, newBdia);
    var existe = path.findIndex(function(elem){
      //console.log(elem, newBdia);
      if (elem === newBdia){
        return true;
      }else{
        return false;
      }
    });

    if (path === 'gifdata.newgif'){
      newgifCount =+1;
    }
    // Adiciona bom dia no banco de bom dias
    if (existe === -1) {
      path.push(newBdia);
      newBdiaCount +=1;
      console.log(newBdiaCount);
    }
    if (newBdiaCount > 10){
      saveNewdata(bddata);
      newBdiaCount=0;
    } else if(newgifCount > 10){
      saveNewdata(gifdata);
      newgifCount=0;
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
  function saveNewdata(dataVar){
    var datalth = Object.keys(dataVar).length;
    console.log(Object.keys(bddata).length, Object.keys(gifdata).length, datalth, datalth < 3 ? '/gifdata.json':'/data.json', Object.keys(dataVar).length < 3 ? '/gifdata.json':'/data.json');
    var filename =  Object.keys(dataVar).length > 3 ? '/data.json' : '/gifdata.json';
    console.log(filename);
    let json = JSON.stringify(dataVar, null, 2);
    dbx.filesUpload({ path: filename, contents: json, mode:'overwrite' })
      .then(function (response) {
        console.log('Data Saved.');
        startRead();
      })
      .catch(function (err) {
        console.log('Error: ', err);
      });
  }
