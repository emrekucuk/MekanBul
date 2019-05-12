//anaSayfa controller metodu
//index.js dosyasındaki router.get('/',ctrlMekanlar.anaSayfa);
//ile metot url'ye bağlanıyor

var request = require('request');



var apiSecenekleri = {

	sunucu: "http://localhost:3000",
	apiYolu: '/api/mekanlar/'
};

var mesafeyiFormatla =function (mesafe) {
  var yeniMesafe, birim;
  if(mesafe>1) {
   yeniMesafe=parseFloat(mesafe).toFixed(1);
   birim = 'km';
  }
  else {
  	yeniMesafe =parseInt(mesafe * 1000,10);
  	birim ='m';
  }
    return yeniMesafe + birim;

};


var anaSayfaOluştur =function(req, res,cevap,mekanListesi){
 var mesaj;
 if(!(mekanListesi instanceof Array)){
 	mesaj ="API HATASI: Birşeyler ters gitti";
 	mekanListesi = [];
 }
 else {
 	if(!mekanListesi.length){
 		mesaj = "Civarda Herhangi Bir Mekan Bulunamadı!";
 	}
 }
 res.render('mekanlar-liste',
   {
   	title: 'MekanBul-Yakınınızdaki Mekanları Bul',
   	sayfaBaslik:{
   		siteAd:'MekanBul',
   		aciklama:'Yakınınızdaki Kafeleri, Restoranları Bulun!'
   	},
   	mekanlar:mekanListesi,
   	mesaj: mesaj,
   	cevap: cevap
   });


 	
};

const anaSayfa=function(req,res){
var istekSecenekleri;
  istekSecenekleri = 
  {
  url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu,
  method : "GET",
  json : {},
  

  qs : {
  	enlem : req.query.enlem,
  	boylam :req.query.boylam
  }

  };
  request(
    istekSecenekleri,

    function(hata,cevap,mekanlar){
    	var i, gelenMekanlar;
    	gelenMekanlar = mekanlar;

    	if(!hata && gelenMekanlar.length){
    		for(i=0;i<gelenMekanlar.length;i++){
    			gelenMekanlar[i].mesafe = mesafeyiFormatla(gelenMekanlar[i].mesafe);
    		}
    	}
    	anaSayfaOluştur(req, res, cevap,gelenMekanlar);
    }

  );

}
var detaySayfasiOlustur = function(req,res,mekanDetaylari){
	res.render('mekan-detay',
    {
    	baslik: mekanDetaylari.ad,
    	sayfaBaslik: mekanDetaylari.ad,
    	mekanBilgisi: mekanDetaylari
    });

		
}
var hataGoster =function(req, res,durum){
	var baslik,icerik;
	if(durum==404){
		baslik="404, Sayfa Bulunamadı!";
		icerik="Kusura Bakma Sayfayı Bulamadık"
	}
	else{
		baslik=durum+"Birşeyler ters gitti!";
		icerik="Ters Giden Birşeyler var!"
	}
	res.status(durum);
	res.render('hata',{
       baslik:baslik,
       icerik:icerik

		});
};
var mekanBilgisiGetir = function(req,res,callback){
  var istekSecenekleri;
  //istek seçeneklerini ayarla
  istekSecenekleri = {
    //tam yol
    url:apiSecenekleri.sunucu+apiSecenekleri.apiYolu+req.params.mekanid,
    //veri çekmek için get metodu
    method:"GET",
    //Dönen veri Json formatında olacak
    json: {}

  };
  request(
    istekSecenekleri,
    //geri dönüş metodu
    function(hata,cevap,mekanDetaylari){
      var gelenMekan = mekanDetaylari;
      if (!hata) {
        //enlem ve boyla bir dizi şeklinde bunu ayır
        //0 da enlem 1 de boylam var
        gelenMekan.koordinatlar={
          enlem:mekanDetaylari.koordinatlar[0],
          boylam:mekanDetaylari.koordinatlar[1]
        };
        callback(req,res,gelenMekan);

      }else{
        hataGoster(req,res,cevap.statusCode);
      }
    }
    );
};
//mekanBilgisi controller metodu
//index.js dosyasındaki router.get('/mekan', ctrlMekanlar.mekanBilgisi);
//ile metot url'ye bağlanıyor
const mekanBilgisi=function(req,res,callback){
	mekanBilgisiGetir(req,res,function(req,res,cevap){
    detaySayfasiOlustur(req,res,cevap);
  });
};

//yorumEkle controller metodu
//index.js dosyasındaki router.get('/mekan/yorum/yeni', ctrlMekanlar.yorumEkle);
//ile metot url'ye bağlanıyor
const yorumEkle=function(req,res){
	mekanBilgisiGetir(req,res,function(req,res,cevap){
    yorumSayfasıOlustur(req,res,cevap);
  }); 
}
const yorumumuEkle=function(req,res){
  var istekSecenekleri,gonderilenYorum,mekanid;
  mekanid=req.params.mekanid;
  gonderilenYorum={
    yorumYapan:req.body.name,
    puan:parseInt(req.body.rating,10),
    yorumMetni:req.body.review
    
  };
  istekSecenekleri={
    url:apiSecenekleri.sunucu+apiSecenekleri.apiYolu+mekanid+'yorumlar',
    method:"POST",
    json:gonderilenYorum
  };
  if (!gonderilenYorum.yorumYapan || !gonderilenYorum.puan || !gonderilenYorum.yorumMetni) {
    res.redirect('/mekan/'+mekanid+'/yorum/yeni?hata=evet');
  }else{
    request(
      istekSecenekleri,
      function(hata,cevap,body){
        if (cevap.statusCode === 201) {
          res.redirect('/mekan/'+mekanid);
        }
        else if (cevap.statusCode === 400 && body.name === "ValidationError") {
          res.redirect('/mekan/'+mekanid+'/yorum/yeni?hata=evet');
        }
        else{
          hataGoster(req,res,cevap.statusCode);
        }
      }
      );
    }
  };


//metotlarımızı kullanmak üzere dış dünyaya aç
//diğer dosyalardan require ile alabilmemizi sağlayacak
module.exports = {
anaSayfa,
mekanBilgisi,
yorumEkle,
yorumumuEkle
};

