(function () {
    "use strict";

    var root = this;

    var canvas = document.getElementById("matrix");

    // fullscreen canvas
    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
        // Use higher resolution on retina displays
        var canvasWidth = window.innerWidth;
        var canvasHeight = window.innerHeight;

        canvas.width = canvasWidth * window.devicePixelRatio;
        canvas.height = canvasHeight * window.devicePixelRatio;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";
        canvas.getContext('2d').scale(window.devicePixelRatio, window.devicePixelRatio);
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    var Pool = function (size) {
        var data = [];
        var maxPoolSize = size;
        
        var fetch = function () {
            var fetchSize = maxPoolSize - data.length;
            if (fetchSize <= 0) {
                return;
            }

            console.log("fetching: %s", fetchSize);
            
            $.each(quotes, function (i,drop) {
                console.info(drop);
                data.push(new Drop(drop));
            });

            if (!Pool.ready && data.length >= (maxPoolSize / 2)) {
                console.log('pool is ready');
                Pool.onReady.call(root);
                Pool.ready = true;
            }
        };
        this.next = function () {
            return data.pop();
        };
        this.hasNext = function () {
            return data.length > 0;
        };

        this.setMaxPoolSize = function (newSize) {
            maxPoolSize = newSize;
        };
        this.schedule = function (onReady) {
            if (Pool.scheduling) {
                return;
            }
            console.log('scheduling pool');
            Pool.ready = false;
            Pool.onReady = onReady;
            Pool.scheduling = true;

            fetch();
            setInterval(fetch, 5000);
        };
    };

    var Drop = function (commit) {
        var text = commit.yazar + "|" + commit.tr;

        this.draw = function (ctx, posX, posY, y) {
            if (y < commit.yazar.length + 1) {
                ctx.shadowColor = '#f1c40f';
                ctx.fillStyle = "#f1c40f";
            } else {
                ctx.fillStyle = "#c0392b";
                ctx.shadowColor = '#c0392b';
            }

            var char = text[y] || '';
            ctx.fillText(char, posX, posY);
        };
    };

    var Matrix = function (options) {
        var canvas = options.canvas,
            ctx = canvas.getContext("2d"),
            pool = new Pool(200),
            that = this,
            interval,
            numColumns,
            columns,
            drops = [];

        var initialize = function () {
            numColumns = Math.floor(canvas.width / options.fontSize);
            pool.setMaxPoolSize(numColumns * 2);
            columns = [];

            for (var col = 0; col < numColumns; col++) {
                columns[col] = canvas.height;
            }
        };

        var isReset = function (posY) {
            return posY > canvas.height && Math.random() > options.randomFactor;
        };

        var drawBackground = function () {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(0, 0, 0, " + options.alphaFading + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        var drawText = function () {
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 3;
            ctx.font = options.fontSize + "px 'Courier New'";

            for (var x = 0; x < columns.length; x++) {
                var posX = x * options.fontSize;
                var posY = columns[x] * options.fontSize;
                var y = columns[x] - 1;

                var drop = drops[x];
                if (!drop) {
                    drop = pool.next();
                    drops[x] = drop;
                }

                drop.draw(ctx, posX, posY, y);

                if (isReset(posY)) {
                    columns[x] = 0;
                    if (pool.hasNext()) {
                        drops[x] = null;
                    }
                }

                columns[x]++;
            }
        };

        var draw = function () {
            drawBackground();
            drawText();
        };

        this.start = function () {
            new Intro(options)
                .start()
                .then(function () {
                    pool.schedule(function () {
                        initialize();
                        that.play();
                        $(canvas).css('cursor', 'pointer');
                        $('.controls').show();
                    });
                });
        };

        this.pause = function () {
            if (!interval) return;

            console.log('pause');
            clearInterval(interval);
            interval = null;

            $('.play-toggle')
                .attr('title', 'Play [SPACE]')
                .find('.fa')
                .removeClass('fa-pause')
                .addClass('fa-play');
        };

        this.play = function () {
            if (interval) return;

            console.log('play');
            interval = setInterval(draw, options.intervalTime);

            $('.play-toggle')
                .attr('title', 'Pause [SPACE]')
                .find('.fa')
                .removeClass('fa-play')
                .addClass('fa-pause');
        };

        this.toggle = function () {
            if (interval) {
                this.pause();
            } else {
                this.play();
            }
        };


        $(window).on('resize', _.debounce(function () {
            that.pause();

            console.log('re-initialize after resize');
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
            initialize();

            that.play();
        }, 300));

    };

    var Intro = function (options) {
        var canvas = options.canvas;
        var ctx = canvas.getContext("2d");

        var xMax = Math.floor(canvas.width / options.fontSize);
        var yMax = Math.ceil(canvas.height / options.fontSize);

        var draw = function () {
            drawBackground();
            drawNumbers();
        };

        var drawBackground = function () {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        var drawNumbers = function () {
            for (var x = 1; x < xMax; x++) {
                if (x % 16 === 0) continue;

                for (var y = 1; y < yMax; y++) {
                    //if (y % 16 === 0) continue;

                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowBlur = 3;
                    ctx.font = options.fontSize + "px 'Courier New'";
                    ctx.fillStyle = "#c0392b";
                    ctx.shadowColor = '#c0392b';

                    var posX = x * options.fontSize;
                    var posY = y * options.fontSize;

                    var num = Math.ceil(Math.random() * 9);
                    if (Math.random() > 0.99) {
                        num = 'π';
                    }

                    ctx.fillText(String(num), posX, posY);
                }
            }
        };

        this.start = function () {
            console.log('starting intro');
            var that = this;
            var interval = setInterval(draw, 150);
            setTimeout(function () {
                console.log('ending intro');
                clearInterval(interval);
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                that.start.then();
            }, 2000);
            return that;
        };

        this.then = function (fn) {
            this.start.then = fn;
        };
    };

    var matrix = new Matrix({
        canvas: canvas,
        fontSize: 14,
        alphaFading: 0.04,
        randomFactor: 0.995,
        intervalTime: 120
    });
    matrix.start();

})();

var quotes = [
    {
      "id": "5a6ce86f2af929789500e824",
      "yazar": "Ken Thompson",
      "tr": "En verimli günlerimden biri 1000 satırlık kodu çöpe atmaktı."
    },
    {
      "id": "5a6ce86f2af929789500e825",
      "yazar": "Grace Hopper",
      "tr": "Doğru bir ölçüm, bin uzman görüşünden daha değerlidir."
    },
    {
      "id": "5a6ce86f2af929789500e80d",
      "yazar": "Fred Brooks",
      "tr": "Bir programcı bir ayda, iki programcı iki ayda yapabilir."
    },
    {
      "id": "5a6ce86f2af929789500e82e",
      "yazar": "Rick Osborne",
      "tr": "Her zaman kodunuzu korumayı bitiren adam nerede yaşadığınızı bilen şiddetli bir psikopat olacakmış gibi kodlayın."
    },
    {
      "id": "5a6ce86f2af929789500e830",
      "yazar": "John Ousterhout",
      "tr": "Yanlış sonuçları iki kat hızlı üreten bir program sonsuz derecede yavaştır."
    },
    {
      "id": "5a6ce86f2af929789500e828",
      "yazar": "Poul Anderson",
      "tr": "Ne kadar karmaşık olursa olsun, doğru bir şekilde bakıldığında daha karmaşık hale gelmeyen herhangi bir soruna henüz rastlamadım."
    },
    {
      "id": "5a6ce86f2af929789500e82a",
      "yazar": "Robert C. Martin",
      "tr": "Kod temizleme zaman almaz. Kodu temizleme zaman almaz."
    },
    {
      "id": "5a6ce86f2af929789500e837",
      "yazar": "David Gelernter",
      "tr": "Bilgisayarda güzellik, teknolojideki herhangi bir yerden daha önemlidir çünkü yazılım çok karmaşıktır. Güzellik, karmaşıklığa karşı nihai savunmadır."
    },
    {
      "id": "5a6ce86f2af929789500e833",
      "yazar": "Edward V. Berard",
      "tr": "Her ikisi de donmuşsa, su üzerinde yürümek ve bir spesifikasyondan yazılım geliştirmek kolaydır."
    },
    {
      "id": "5a6ce86f2af929789500e836",
      "yazar": "Brian Kernighan",
      "tr": "Hata ayıklamak, ilk etapta kodu yazmaktan iki kat daha zordur. Bu nedenle, kodu olabildiğince akıllıca yazarsanız, tanımı gereği hata ayıklayacak kadar akıllı değilsiniz."
    },
    {
      "id": "5a6ce86f2af929789500e838",
      "yazar": "Brian Kernighan",
      "tr": "Karmaşıklığı kontrol etmek bilgisayar programlamanın özüdür."
    },
    {
      "id": "5a6ce86f2af929789500e83f",
      "yazar": "Chris Wenham",
      "tr": "Hata ayıklama süresi, programın boyutunun karesi kadar artar."
    },
    {
      "id": "5a6ce86f2af929789500e82c",
      "yazar": "Seymour Cray",
      "tr": "Programcıların sorunu, bir programcının ne yaptığını çok geç olmadan asla anlayamamanızdır."
    },
    {
      "id": "5a6ce86f2af929789500e843",
      "yazar": "Ron Jeffries",
      "tr": "Kod asla yalan söylemez, yorumlar bazen yalan söyler."
    },
    {
      "id": "5a6ce86f2af929789500e845",
      "yazar": "Laurence J. Peter",
      "tr": "Bazı problemler o kadar karmaşıktır ki, onlar hakkında kararsız kalabilmek için son derece zeki ve bilgili olmanız gerekir."
    },
    {
      "id": "5a6ce86f2af929789500e841",
      "yazar": "Poul-Henning Kamp",
      "tr": "Bir tahminde bulunun, sayıyı ikiye katlayın ve ardından bir sonraki daha büyük zaman birimine geçin. Bu kural, görevleri çok ilginç bir şekilde ölçeklendirir: bir dakikalık bir görev, 120 kat patlayarak iki saat sürer. Bir saatlik iş yalnızca 48 kat artarak iki gün sürerken, bir günlük iş 14 kat artarak iki hafta sürer."
    },
    {
      "id": "5a6ce86f2af929789500e847",
      "yazar": "Albert Einstein",
      "tr": "Özel bir yeteneğim yok. Sadece tutkuyla merak ediyorum."
    },
    {
      "id": "5a6ce86f2af929789500e849",
      "yazar": "Robert C. Martin",
      "tr": "Yorumların doğru kullanımı, kendimizi kodla ifade edemememizi telafi etmektir."
    },
    {
      "id": "5a6ce86f2af929789500e852",
      "yazar": "Rob Pike",
      "tr": "Tür hiyerarşisi olmadığında, tür hiyerarşisini yönetmeniz gerekmez."
    },
    {
      "id": "5a6ce86f2af929789500e856",
      "yazar": "Steve Jobs",
      "tr": "Herkes bilgisayar programlamayı öğrenmeli çünkü o sana nasıl düşüneceğini öğretir."
    },
    {
      "id": "5a6ce86f2af929789500e84f",
      "yazar": "Chris Sacca",
      "tr": "Basitlik oluşturmak zor, kullanmak kolay ve ücretlendirmesi zor. Karmaşıklık oluşturmak kolay, kullanmak zor ve ücretlendirmesi kolay."
    },
    {
      "id": "5a6ce8702af929789500e85a",
      "yazar": "Bill Gates",
      "tr": "Programlama ilerlemesini kod satırlarıyla ölçmek, uçak inşa etme ilerlemesini ağırlıkla ölçmek gibidir."
    },
    {
      "id": "5a6ce8702af929789500e85e",
      "yazar": "William Wulf",
      "tr": "Verimlilik adına (mutlaka başarmak zorunda kalmadan) başka herhangi bir nedenden daha fazla bilgi işlem günahı işleniyor - kör aptallık dahil."
    },
    {
      "id": "5a6ce8702af929789500e860",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Test yapmak, hataların varlığını göstermenin çok etkili bir yolu olabilir, ancak onların yokluğunu göstermek için umutsuzca yetersizdir."
    },
    {
      "id": "5a6ce8702af929789500e864",
      "yazar": "Albert Einstein",
      "tr": "Hayal gücü bilgiden daha önemlidir."
    },
    {
      "id": "5a6ce8702af929789500e862",
      "yazar": "Buckminster Fuller",
      "tr": "Bir sorun üzerinde çalışırken asla güzelliği düşünmem. Sadece sorunu nasıl çözeceğimi düşünürüm. Ama bitirdiğimde, çözüm güzel değilse yanlış olduğunu bilirim."
    },
    {
      "id": "5a6ce86f2af929789500e84b",
      "yazar": "Sean Ebeveyn",
      "tr": "İyi kod kısa, basit ve simetriktir - zorluk oraya nasıl ulaşılacağını bulmaktır."
    },
    {
      "id": "5a6ce8702af929789500e868",
      "yazar": "Linus Torvalds",
      "tr": "Kullanıcılarınızın aptal olduğunu düşünüyorsanız, bunu yalnızca aptallar kullanır."
    },
    {
      "id": "5a6ce8702af929789500e872",
      "yazar": "Albert Einstein",
      "tr": "Öğrenmeyi bıraktığınızda ölmeye başlarsınız."
    },
    {
      "id": "5a6ce8702af929789500e884",
      "yazar": "Kevlin Henney",
      "tr": "Hiçbir kod, hiç koddan daha hızlı değildir."
    },
    {
      "id": "5a6ce8702af929789500e86c",
      "yazar": "Richard P. Gabriel",
      "tr": "Bir proje üzerinde çalışmak için harcadığınız zamanın yarısından fazlası düşünmeye harcanır ve ne kadar gelişmiş olursa olsun hiçbir araç sizin için düşünemez."
    },
    {
      "id": "5a6ce8702af929789500e86e",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Örneğin, artık bir hatayı hata olarak değil, hata olarak adlandırarak dilimizi temizlemekle başlayabiliriz. Çok daha dürüst çünkü suçu doğrudan ait olduğu yere koyuyor, yani. Hatayı yapan programcı Programcı bakmıyorken kötü niyetli bir şekilde içeri sızan bug'ın animistik metaforu, hatanın programcının kendi eseri olduğunu gizlediği için entelektüel olarak sahtekardır.Bu basit kelime değişikliğinin güzel yanı, çok derin bir etkisi var: önceden, yalnızca bir hataya sahip bir program neredeyse doğru iken, daha sonra hatalı bir program sadece yanlış"
    },
    {
      "id": "5a6ce8702af929789500e88b",
      "yazar": "Stewart Markası",
      "tr": "Yeni bir teknoloji çalışmaya başladığında, buharlı silindirin bir parçası değilseniz, yolun bir parçası olursunuz."
    },
    {
      "id": "5a6ce8702af929789500e887",
      "yazar": "John Gall (yazar)",
      "tr": "Çalışan karmaşık bir sistemin, çalışan basit bir sistemden evrimleştiği her zaman anlaşılır. Ters önerme de doğru gibi görünüyor: Sıfırdan tasarlanmış karmaşık bir sistem asla çalışmaz ve çalıştırılamaz."
    },
    {
      "id": "5a6ce8702af929789500e889",
      "yazar": "Henry Petroski",
      "tr": "Bilgisayar yazılımı endüstrisinin en şaşırtıcı başarısı, bilgisayar donanımı endüstrisinin sürekli ve şaşırtıcı kazanımlarını sürekli olarak iptal etmesidir."
    },
    {
      "id": "5a6ce8702af929789500e88e",
      "yazar": "Carl Friedrich Gauss",
      "tr": "Birkaç kelimeyle olabildiğince çok şey söyleyene kadar asla tatmin olmuyorum ve kısaca yazmak uzun yazmaktan çok daha fazla zaman alıyor."
    },
    {
      "id": "5a6ce8702af929789500e890",
      "yazar": "Bjarne Stroustrup",
      "tr": "Yalnızca iki tür dil vardır: İnsanların şikayet ettiği ve kimsenin kullanmadığı diller."
    },
    {
      "id": "5a6ce8702af929789500e892",
      "yazar": "Pamela Zave",
      "tr": "Yazılım mühendisliğinin amacı karmaşıklığı yaratmak değil, kontrol etmektir."
    },
    {
      "id": "5a6ce8702af929789500e89a",
      "yazar": "Dennis Ritchie",
      "tr": "Unix basittir. Basitliğini anlamak için dahi olmak yeterlidir."
    },
    {
      "id": "5a6ce8702af929789500e89c",
      "yazar": "Dennis Ritchie",
      "tr": "Her şeye sahip olmayan bir dili programlamak, bazılarına göre programlamak aslında daha kolaydır."
    },
    {
      "id": "5a6ce8702af929789500e8a2",
      "yazar": "Richard Feynman",
      "tr": "Yapamadığım şeyi anlamıyorum."
    },
    {
      "id": "5a6ce8702af929789500e8a6",
      "yazar": "Albert Einstein",
      "tr": "Her zeki aptal, işleri daha büyük, daha karmaşık ve daha şiddetli hale getirebilir. Ters yönde ilerlemek için bir deha dokunuşu - ve çok fazla cesaret - gerekir."
    },
    {
      "id": "5a6ce8702af929789500e898",
      "yazar": "Lawrence Flon",
      "tr": "Ne kadar yapılandırılmış olursa olsun, programcıların kötü programlar yapmasını engelleyecek hiçbir programlama dili yoktur."
    },
    {
      "id": "5a6ce8702af929789500e8a8",
      "yazar": "Martin Fowler",
      "tr": "Her aptal bilgisayarın anlayabileceği bir kod yazabilir. İyi programcılar insanların anlayabileceği kodlar yazar."
    },
    {
      "id": "5a6ce8702af929789500e894",
      "yazar": "Joe Armstrong (programcı)",
      "tr": "Nesne yönelimli dillerle ilgili sorun, yanlarında taşıdıkları tüm bu örtük ortama sahip olmalarıdır. Bir muz istediniz ama elinizde muzu ve tüm ormanı tutan bir goril vardı."
    },
    {
      "id": "5a6ce8702af929789500e86a",
      "yazar": "Ken Thompson",
      "tr": "Tamamen kendiniz oluşturmadığınız bir koda güvenemezsiniz."
    },
    {
      "id": "5a6ce8702af929789500e8a4",
      "yazar": "Albert Einstein",
      "tr": "Akıllı bir kişi bir sorunu çözer. Akıllı bir kişi ondan kaçınır."
    },
    {
      "id": "5a6ce8702af929789500e8ac",
      "yazar": "Bjarne Stroustrup",
      "tr": "Yazılım geliştirmenin en önemli yönü, ne oluşturmaya çalıştığınız konusunda net olmaktır."
    },
    {
      "id": "5a6ce8702af929789500e8aa",
      "yazar": "Jonathan Shewchuk",
      "tr": "Tek günah, seçim yaptığınızı bilmeden seçim yapmaktır."
    },
    {
      "id": "5a6ce8702af929789500e8b0",
      "yazar": "Ryan Singer",
      "tr": "Yazılımdaki bu kadar karmaşıklık, bir şeyi iki şeyi yapmaya çalışmaktan kaynaklanır."
    },
    {
      "id": "5a6ce8702af929789500e8b2",
      "yazar": "PJ Plauger",
      "tr": "Hofstadter Yasası: Hofstadter Yasasını hesaba katsanız bile her zaman beklediğinizden daha uzun sürer."
    },
    {
      "id": "5a6ce8702af929789500e8b6",
      "yazar": "John Johnson",
      "tr": "Önce sorunu çözün. Ardından kodu yazın."
    },
    {
      "id": "5a6ce8702af929789500e8b4",
      "yazar": "Doug Linder",
      "tr": "İyi bir programcı, tek yönlü bir caddeyi geçmeden önce iki yöne de bakan kişidir."
    },
    {
      "id": "5a6ce8702af929789500e8b8",
      "yazar": "David Wheeler (bilgisayar bilimcisi)",
      "tr": "Uyumluluk, diğer insanların hatalarını kasıtlı olarak tekrarlamak anlamına gelir."
    },
    {
      "id": "5a6ce8702af929789500e8ba",
      "yazar": "Jeremy S. Anderson",
      "tr": "Berkeley'den çıkan iki ana ürün var: LSD ve UNIX. Bunun tesadüf olduğuna inanmıyoruz."
    },
    {
      "id": "5a6ce8702af929789500e8bc",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Yetkin programcı kendi kafatasının kesinlikle sınırlı boyutunun tamamen farkındadır; bu nedenle programlama görevine tam bir alçakgönüllülükle yaklaşır ve diğer şeylerin yanı sıra veba gibi akıllı numaralardan kaçınır"
    },
    {
      "id": "5a6ce8702af929789500e8ae",
      "yazar": "Joshua Bloch",
      "tr": "Şüpheye düştüğünüzde, bırakın."
    },
    {
      "id": "5a6ce8702af929789500e8be",
      "yazar": "Linus Torvalds",
      "tr": "Aslında, kötü bir programcı ile iyi bir programcı arasındaki farkın, kodunun mu yoksa veri yapılarının mı daha önemli olduğunu düşündüğünü iddia edeceğim. Kötü programcılar kod için endişelenir. İyi programcılar veri yapıları hakkında endişelenir ve onların ilişkileri."
    },
    {
      "id": "5a6ce8702af929789500e8ce",
      "yazar": "Albert Einstein",
      "tr": "Arayabileceğin bir şeyi asla ezberleme."
    },
    {
      "id": "5a6ce8702af929789500e8cc",
      "yazar": "Richard Hamming",
      "tr": "Matematikçiler birbirlerinin omuzlarında ve bilgisayar bilimcileri birbirlerinin parmak uçlarında durur."
    },
    {
      "id": "5a72399510263e0c45cb6cfa",
      "yazar": "Edsger W. Dijkstra",
      "tr": "LISP, en yetenekli insan kardeşlerimizin daha önce imkansız olan düşünceleri düşünmesine yardımcı oldu."
    },
    {
      "id": "5a6ce8702af929789500e8c6",
      "yazar": "Bjarne Stroustrup",
      "tr": "Programcılarına moron gibi davranan bir kuruluş, yakında yalnızca moron gibi davranmaya istekli ve yetenekli programcılara sahip olacak."
    },
    {
      "id": "5a82224c89919d0004b357ce",
      "yazar": "Anonim",
      "tr": "Düğme çalışıyor, sadece görülemiyor."
    },
    {
      "id": "5a8225ee89919d0004b357d0",
      "yazar": "Douglas Crockford",
      "tr": "Hiçbir şey için endişelenme. Sadece elinden geleni yap ve olabileceğinin en iyisi ol."
    },
    {
      "id": "5a82b607fc716e0004373f53",
      "yazar": "Tom DeMarco",
      "tr": "Yazılım geliştirme işi aslında hiç de yüksek teknolojili bir iş değil. Her şeyden önce birbirimizle konuşma ve bir şeyler yazma işi."
    },
    {
      "id": "5a6ce8702af929789500e8ca",
      "yazar": "Paul Graham (programcı)",
      "tr": "Programlamanın zor kısmı problemleri çözmek değil, hangi problemlerin çözüleceğine karar vermektir."
    },
    {
      "id": "5a82cd0efc716e0004373f56",
      "yazar": "Tom DeMarco",
      "tr": "Yöneticinin işlevi insanları çalıştırmak değil, insanların çalışmasını mümkün kılmaktır."
    },
    {
      "id": "5a82c90cfc716e0004373f55",
      "yazar": "Tom DeMarco",
      "tr": "Baskı altındaki insanlar daha iyi çalışmazlar, sadece daha hızlı çalışırlar."
    },
    {
      "id": "5a8946eda578110004299a3b",
      "yazar": "Donald Knuth",
      "tr": "Hayatımın on yılını TEX projesinde çalışarak geçirdikten sonra ana sonucum, yazılımın zor olduğudur. Yapmak zorunda kaldığım her şeyden daha zor."
    },
    {
      "id": "5a82cd5ffc716e0004373f57",
      "yazar": "Donald Knuth",
      "tr": "Bilim, bir bilgisayara açıklayabilecek kadar iyi anladığımız şeydir. Sanat, yaptığımız diğer her şeydir."
    },
    {
      "id": "5a896544a12a0e0004c76124",
      "yazar": "Donald Knuth",
      "tr": "Bilgisayar programlamanın bir sanat olduğunu gördük, çünkü birikmiş bilgiyi dünyaya uyguluyor, beceri ve ustalık gerektiriyor ve özellikle de güzel nesneler ürettiği için."
    },
    {
      "id": "5a82cd91fc716e0004373f58",
      "yazar": "Donald Knuth",
      "tr": "E-posta, hayattaki rolü her şeyin üstünde olmak olan insanlar için harika bir şey. Ama benim için değil; benim rolüm her şeyin altında olmak. Yaptığım şey uzun saatler çalışma gerektiriyor ve kesintisiz konsantrasyon."
    },
    {
      "id": "5a8e9b5884a8f2000482568b",
      "yazar": "Kevlin Henney",
      "tr": "Daha az kod, daha az hataya eşittir."
    },
    {
      "id": "5a91370b2141d30004b42e58",
      "yazar": "Charles Babbage",
      "tr": "Bir Analitik Motor var olur olmaz, bilimin gelecekteki seyrine mutlaka rehberlik edecektir."
    },
    {
      "id": "5a9137d72141d30004b42e59",
      "yazar": "Charles Babbage",
      "tr": "Olguların yokluğundan kaynaklanan hatalar, doğru verilere ilişkin yanlış akıl yürütmeden kaynaklanan hatalardan çok daha fazla sayıda ve daha kalıcıdır."
    },
    {
      "id": "5a9138442141d30004b42e5a",
      "yazar": "Charles Babbage",
      "tr": "Bazı okuyucularımıza belki de paradoksal görünebilecek bir şeyden daha önce bahsetmiştik - işbölümünün mekanik işlemlere olduğu kadar zihinsel işlemlere de eşit başarıyla uygulanabileceğinden ve her iki ekonomide de aynı başarıyı sağladığından. zamanın."
    },
    {
      "id": "5a9139472141d30004b42e5b",
      "yazar": "Charles Babbage",
      "tr": "[Parlamento üyeleri tarafından] iki kez bana soruldu: \"Dua edin Bay Babbage, makineye yanlış rakamlar koyarsanız, doğru cevaplar ortaya çıkar mı?\" Doğru dürüst yapamam. Böyle bir soruyu kışkırtabilecek türden bir fikir karmaşasını kavramak için."
    },
    {
      "id": "5a91be60346ab3000418a760",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Makineler olmadığı sürece programlama hiç sorun değildi; birkaç zayıf bilgisayarımız olduğunda programlama hafif bir sorun haline geldi ve şimdi devasa bilgisayarlarımız var, programlama eşit derecede devasa bir sorun haline geldi."
    },
    {
      "id": "5a91e12fc4240c0004265950",
      "yazar": "Edsger W. Dijkstra",
      "tr": "COBOL kullanımı zihni sakatlar; bu nedenle öğretilmesi ceza gerektiren bir suç olarak görülmelidir."
    },
    {
      "id": "5a91d1c1c4240c000426594f",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Daha etkili programcılar istiyorsanız, hata ayıklamak için zamanlarını boşa harcamamaları gerektiğini, başlangıçta hataları tanıtmamaları gerektiğini keşfedeceksiniz."
    },
    {
      "id": "5a91e150c4240c0004265951",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Önceden BASIC'e maruz kalmış öğrencilere iyi programlama öğretmek pratikte imkansızdır: potansiyel programcılar olarak, yenilenme umudunun ötesinde zihinsel olarak sakatlanırlar."
    },
    {
      "id": "5a91e27ec4240c0004265953",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Bir resim bin kelimeye bedel olabilir, bir formül bin resme bedeldir."
    },
    {
      "id": "5a91e224c4240c0004265952",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Yani, bundan 10 yıl sonra, hızlı ve kirli bir şey yaparken aniden benim omuzlarının üzerinden baktığımı ve kendi kendine Dijkstra bundan hoşlanmazdı dersen, peki, bu benim için yeterli ölümsüzlük olurdu."
    },
    {
      "id": "5a91bc8f346ab3000418a75f",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Yetkili programlamanın ortalama bir programcı için çok zor olacağı gerçeğinden dolayı beni suçlamayın— bir cerrahi tekniği reddetme tuzağına düşmemelisiniz çünkü bu bir berberin yeteneklerinin ötesindedir köşedeki dükkanında."
    },
    {
      "id": "5a91e37bc4240c0004265955",
      "yazar": "John von Neumann",
      "tr": "Genç adam, matematikte bazı şeyleri anlamıyorsun. Sadece alışıyorsun."
    },
    {
      "id": "5a91e40ec4240c0004265957",
      "yazar": "Dennis Ritchie",
      "tr": "C tuhaf, kusurlu ve muazzam bir başarı."
    },
    {
      "id": "5a91e2d0c4240c0004265954",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Üniversitenin görevi toplumun istediğini sunmak değil, toplumun ihtiyacı olanı vermektir."
    },
    {
      "id": "5a895d1ba5f8bf3df4485d1d",
      "yazar": "Donald Knuth",
      "tr": "Makine odaklı bir dili anlayan programcı, çok daha verimli bir yöntem kullanma eğiliminde olacaktır; gerçeğe çok daha yakındır."
    },
    {
      "kimlik": "5a91e459c4240c0004265958",
      "yazar": "Dennis Ritchie",
      "tr": "Bir başka tehlike de, şu ya da bu türden ticari baskıların, en iyi düşünürlerin dikkatini gerçek inovasyondan mevcut modanın sömürülmesine, bilinen bir madenciliği araştırmaktan çıkarmaya yöneltmesidir."
    },
    {
      "kimlik": "5a91e51dc4240c0004265959",
      "yazar": "Bjarne Stroustrup",
      "tr": "C++ içinde, çıkmak için mücadele eden çok daha küçük ve daha temiz bir dil var."
    },
    {
      "id": "5a91e560c4240c000426595a",
      "yazar": "Bjarne Stroustrup",
      "tr": "Size gelip mükemmel bir dili olduğunu söyleyen herkes ya saftır ya da satıcıdır."
    },
    {
      "id": "5a91e60dc4240c000426595b",
      "yazar": "Alan Turing",
      "tr": "Kağıt, kurşun kalem ve kauçuk ile sağlanan ve sıkı bir disipline tabi olan bir adam, aslında evrensel bir makinedir."
    },
    {
      "id": "5a91e6a3c4240c000426595c",
      "yazar": "Alan Turing",
      "tr": "Dijital bilgisayarların arkasındaki fikir, bu makinelerin bir insan bilgisayarı tarafından yapılabilecek herhangi bir işlemi gerçekleştirmeye yönelik olduğu söylenerek açıklanabilir."
    },
    {
      "id": "5a91e779c4240c000426595d",
      "yazar": "Alan Turing",
      "tr": "Makineler beni çok sık şaşırtıyor."
    },
    {
      "id": "5a933b4c8e7b510004cba4be",
      "yazar": "Bjarne Stroustrup",
      "tr": "Belki \"yalnızca küçük bir global değişken\" çok yönetilemez değildir, ancak bu stil, orijinal programcısı dışında işe yaramaz kodlara yol açar."
    },
    {
      "id": "5a933c3d8e7b510004cba4bf",
      "yazar": "Linus Torvalds",
      "tr": "Ücretsiz bir işletim sistemi yapıyorum (sadece bir hobi, GNU gibi büyük ve profesyonel olmayacak)."
    },
    {
      "id": "5a933cac8e7b510004cba4c0",
      "yazar": "Linus Torvalds",
      "tr": "3'ten fazla girinti düzeyine ihtiyacınız varsa, yine de batmışsınızdır ve programınızı düzeltmeniz gerekir."
    },
    {
      "id": "5a933f078e7b510004cba4c1",
      "yazar": "Linus Torvalds",
      "tr": "GNU Emacs'e yazı yazan sonsuz sayıda maymun asla iyi bir program yapmaz."
    },
    {
      "id": "5a9340258e7b510004cba4c3",
      "yazar": "Linus Torvalds",
      "tr": "Microsoft Linux için uygulamalar yaparsa, ben kazandım demektir."
    },
    {
      "id": "5a933f6f8e7b510004cba4c2",
      "yazar": "Linus Torvalds",
      "tr": "Bak, Linux gibi bir sistem oluşturmak için sadece iyi bir kodlayıcı olmanız yetmez, aynı zamanda sinsi bir piç de olmanız gerekir ;-)"
    },
    {
      "id": "5a9342048e7b510004cba4c6",
      "yazar": "Linus Torvalds",
      "tr": "Gerçekten, Microsoft'u yok etmeye niyetim yok. Bu tamamen kasıtsız bir yan etki olacak."
    },
    {
      "id": "5a9341788e7b510004cba4c5",
      "yazar": "Linus Torvalds",
      "tr": "Konuşmak ucuz. Bana kodu göster."
    },
    {
      "id": "5a9340e08e7b510004cba4c4",
      "yazar": "Tom Cargill",
      "tr": "Kodun ilk yüzde 90'ı geliştirme süresinin ilk yüzde 90'ını oluşturur. Kodun geri kalan yüzde 10'u, geliştirme süresinin diğer yüzde 90'ını oluşturur."
    },
    {
      "id": "5a93467e8e7b510004cba4c8",
      "yazar": "Kent Beck",
      "tr": "Harika bir programcı değilim; sadece harika alışkanlıkları olan iyi bir programcıyım."
    },
    {
      "id": "5a9348828e7b510004cba4c9",
      "yazar": "Bill Gates",
      "tr": "Yazılımda yalnızca bir numara vardır ve o da önceden yazılmış bir yazılım parçasını kullanmaktır."
    },
    {
      "id": "5a93d5a36a584e0004a4a612",
      "yazar": "Steve Jobs",
      "tr": "Müşterilere ne istediklerini sorup sonra onlara vermeye çalışamazsınız. Siz onu inşa ettiğinizde, onlar yeni bir şey isteyeceklerdir."
    },
    {
      "id": "5a93d6b26a584e0004a4a614",
      "yazar": "Steve Jobs",
      "tr": "Bilgisayar benim için ne ise, şimdiye kadar bulduğumuz en dikkat çekici araçtır. Zihnimiz için bir bisikletin karşılığıdır."
    },
    {
      "id": "5a93eb796a584e0004a4a617",
      "yazar": "Marijn Haverbeke",
      "tr": "Programlamanın zor olduğu ortaya çıktı. Temel kurallar genellikle basit ve açıktır. Ancak bu kuralların üzerine inşa edilen programlar, kendi kurallarını ve karmaşıklığını ortaya koyacak kadar karmaşık hale gelme eğilimindedir. Kendinizinkini inşa ediyorsunuz. bir şekilde labirent ve içinde kaybolabilirsiniz."
    },
    {
      "id": "5a93d8036a584e0004a4a615",
      "yazar": "Steve Jobs",
      "tr": "Başarılı girişimcileri başarısız olanlardan ayıran şeyin yaklaşık yarısının saf azim olduğuna inanıyorum. Bu çok zor."
    },
    {
      "id": "5a93da0d6a584e0004a4a616",
      "yazar": "Steve Jobs",
      "tr": "Birçok şirket, onlara ne yapacaklarını söylemeleri için insanları işe alır. Biz de bize ne yapacağımızı söylemeleri için insanları işe alırız."
    },
    {
      "id": "5a93ebdc6a584e0004a4a618",
      "yazar": "Marijn Haverbeke",
      "tr": "Bilgisayarların kendileri sadece aptalca basit şeyler yapabilirler. Bu kadar kullanışlı olmalarının nedeni, bunları inanılmaz derecede yüksek bir hızda yapmalarıdır."
    },
    {
      "id": "5a93ed3d6a584e0004a4a619",
      "yazar": "Marijn Haverbeke",
      "tr": "Bir program bir düşünce inşasıdır. İnşa etmesi masrafsızdır, ağırlıksızdır ve daktilo elimizin altında kolayca büyür. Ancak dikkat edilmezse, bir programın boyutu ve karmaşıklığı kontrolden çıkar, programın kafasını bile karıştırır. Onu yaratan kişi."
    },
    {
      "id": "5a93edc56a584e0004a4a61a",
      "yazar": "Marijn Haverbeke",
      "tr": "Program tasarımında yapılacak birçok korkunç hata var, bu yüzden devam edin ve daha iyi anlamanız için bunları yapın."
    },
    {
      "id": "5a93fd14e49ad10004edb860",
      "yazar": "Donald Knuth",
      "tr": "İnsanlar bilgisayar biliminin dahilerin sanatı olduğunu düşünürler ama gerçek gerçek bunun tam tersidir, sadece birçok insan mini taşlardan bir duvar gibi birbirinin üzerine inşa edilen şeyler yapar."
    },
    {
      "id": "5a94040fe49ad10004edb862",
      "yazar": "Jamie Zawinski",
      "tr": "Profesyonelliğin sanatta yeri yoktur ve bilgisayar korsanlığı sanattır. Yazılım Mühendisliği bilim olabilir; ama yaptığım şey bu değil. Ben bir bilgisayar korsanıyım, mühendis değil."
    },
    {
      "id": "5a940c14e49ad10004edb864",
      "yazar": "Ocak işçisinin inancı",
      "tr": "Sadece taş kesen bizler, her zaman katedralleri hayal ediyor olmalıyız."
    },
    {
      "id": "5a9405d7e49ad10004edb863",
      "yazar": "Roy Fielding",
      "tr": "İletişim, doğası gereği durumsuz olmalıdır, öyle ki, istemciden sunucuya yapılan her istek, isteği anlamak için gerekli tüm bilgileri içermelidir ve sunucuda saklanan herhangi bir bağlamdan yararlanamaz."
    },
    {
      "id": "5a942ea0ee7ed5000496b16f",
      "yazar": "Kent Beck",
      "tr": "Bir yorum yazma ihtiyacı hissettiğinizde, herhangi bir yorumun gereksiz hale gelmesi için önce kodu yeniden düzenlemeyi deneyin."
    },
    {
      "id": "5a942dc4ee7ed5000496b16e",
      "yazar": "Kent Beck",
      "tr": "Bir programa bir özellik eklemeniz gerektiğini ve program kodunun bu özelliği eklemek için uygun bir şekilde yapılandırılmadığını fark ettiğinizde, özelliği eklemeyi kolaylaştırmak için önce programı yeniden gözden geçirin, ardından özellik."
    },
    {
      "id": "5a942fc3ee7ed5000496b171",
      "yazar": "Martin Fowler",
      "tr": "Hata ayıklamaktan daha sinir bozucu veya zaman kaybettiren birkaç şey vardır. En başta hataları yaratmasaydık çok daha hızlı olmaz mıydı?"
    },
    {
      "id": "5a942fa3ee7ed5000496b170",
      "yazar": "Martin Fowler",
      "tr": "Test yaparak, bir hata eklediğimde hemen anlıyorum. Bu, hatayı taramadan ve gizlenmeden hemen önce düzeltmeme izin veriyor."
    },
    {
      "id": "5a942fd8ee7ed5000496b172",
      "yazar": "Martin Fowler",
      "tr": "Bence en değerli kurallardan biri tekrardan kaçınmaktır."
    },
    {
      "id": "5a942ffbee7ed5000496b173",
      "yazar": "Martin Fowler",
      "tr": "Tasarımcılar genellikle, daha fazla donanım satın almanın daha ucuz olabileceği durumlarda, belirli bir donanım platformundaki kapasiteyi artıran karmaşık şeyler yaparlar."
    },
    {
      "id": "5a9430a4ee7ed5000496b175",
      "yazar": "John Carmack",
      "tr": "Bugün programcılar için durum çok daha iyi - ucuz kullanılmış bir bilgisayar, bir linux CD'si ve bir internet hesabı ve çekmek istediğiniz herhangi bir programlama becerisi düzeyine ulaşmak için gerekli tüm araçlara sahipsiniz için."
    },
    {
      "id": "5a94303bee7ed5000496b174",
      "yazar": "John Carmack",
      "tr": "Eğer yola çıkıp büyük yeni bir şey geliştirmek istiyorsanız, milyonlarca dolarlık sermayeye ihtiyacınız yok. Buzdolabınıza koyabileceğiniz kadar pizzaya ve Diyet Kola'ya, üzerinde çalışmak için ucuz bir PC'ye ihtiyacınız var, ve onunla devam etme kararlılığı."
    },
    {
      "id": "5a9430ceee7ed5000496b176",
      "yazar": "John Carmack",
      "tr": "Bir oyundaki hikaye, bir porno filmdeki hikaye gibidir. Orada olması bekleniyor ama o kadar da önemli değil."
    },
    {
      "id": "5a9430fbee7ed5000496b177",
      "yazar": "Paul Graham (programcı)",
      "tr": "Yazılımın yapabileceği en iyi şey kolaydır, ancak bunu yapmanın yolu, kullanıcıların seçimlerini sınırlamak değil, varsayılanları doğru yapmaktır."
    },
    {
      "id": "5a943207ee7ed5000496b178",
      "yazar": "Paul Graham (programcı)",
      "tr": "En önemli şey, istediğini söylemek değil, istediğini düşünebilmektir."
    },
    {
      "id": "5a943233ee7ed5000496b17a",
      "yazar": "Paul Graham (programcı)",
      "tr": "Zamanını boşa harcamadığın sürece ne üzerinde çalıştığın o kadar önemli değil."
    },
    {
      "id": "5a943216ee7ed5000496b179",
      "yazar": "Paul Graham (programcı)",
      "tr": "Programcıların ilk %5'i muhtemelen iyi yazılımların %99'unu yazıyor."
    },
    {
      "id": "5a943244ee7ed5000496b17b",
      "yazar": "Paul Graham (programcı)",
      "tr": "Erteleyen bir yüksek lisans öğrencisi kadar güçlü çok az enerji kaynağı vardır."
    },
    {
      "id": "5a943267ee7ed5000496b17d",
      "yazar": "Bill Gates",
      "tr": "En mutsuz müşterileriniz, en büyük öğrenme kaynağınızdır."
    },
    {
      "id": "5a9432a9ee7ed5000496b17e",
      "yazar": "Bill Gates",
      "tr": "Artık her şeyin çok iyi hazırlanmış olduğu günlerde değiliz. Ancak zirveye çıkan programların kalbinde, önemli dahili kodun, ne yaptıklarını gerçekten biliyorlar."
    },
    {
      "id": "5a943301ee7ed5000496b181",
      "yazar": "Ward Cunningham",
      "tr": "Basitlik nedir? Sadelik, çözüme giden en kısa yoldur."
    },
    {
      "id": "5a943316ee7ed5000496b182",
      "yazar": "Ward Cunningham",
      "tr": "Bir programa yeni bir özellik eklemek önemlidir, ancak gelecekte yeni özelliklerin eklenebilmesi için yeniden düzenleme yapmak da aynı derecede önemlidir."
    },
    {
      "id": "5a94333dee7ed5000496b183",
      "yazar": "Albert Einstein",
      "tr": "Yeni bir fikir aniden ve oldukça sezgisel bir şekilde gelir. Ancak sezgi, daha önceki entelektüel deneyimin sonucundan başka bir şey değildir."
    },
    {
      "id": "5a9433d2ee7ed5000496b184",
      "yazar": "Ludwig Wittgenstein",
      "tr": "Dilimin sınırları, dünyamın sınırları anlamına gelir."
    },
    {
      "id": "5a9434dcee7ed5000496b187",
      "yazar": "Alan Perlis",
      "tr": "10 parametreli bir prosedürünüz varsa, muhtemelen bazılarını kaçırmışsınızdır."
    },
    {
      "id": "5a943438ee7ed5000496b185",
      "yazar": "George Boole",
      "tr": "Dilin insan aklının bir aracı olduğu ve yalnızca düşüncenin ifade edilmesi için bir araç olmadığı, genel olarak kabul edilen bir gerçektir."
    },
    {
      "id": "5a9434edee7ed5000496b188",
      "yazar": "Alan Perlis",
      "tr": "Programlama hakkındaki düşüncelerinizi etkilemeyen bir dil, bilinmeye değmez."
    },
    {
      "id": "5a943501ee7ed5000496b189",
      "yazar": "Alan Perlis",
      "tr": "Sadelik karmaşıklıktan önce gelmez, onu takip eder."
    },
    {
      "id": "5a943514ee7ed5000496b18a",
      "yazar": "Alan Perlis",
      "tr": "Yapay zekayla geçen bir yıl, insanı Tanrı'ya inandırmaya yeter."
    },
    {
      "id": "5a943538ee7ed5000496b18c",
      "yazar": "Alan Perlis",
      "tr": "Medeniyetten olmayanlar için programlama üzerine en iyi kitap Alice Harikalar Diyarında'dır, ancak bunun nedeni amatörler için her konuda en iyi kitap olmasıdır."
    },
    {
      "id": "5a94351fee7ed5000496b18b",
      "yazar": "Alan Perlis",
      "tr": "Başarısızlıkla başa çıkmak kolaydır: Geliştirmek için çok çalışın."
    },
    {
      "id": "5a943485ee7ed5000496b186",
      "yazar": "Alan Perlis",
      "tr": "Bir programlama dili, programları ilgisiz olanlarla ilgilenilmesini gerektirdiğinde düşük seviyelidir."
    },
    {
      "id": "5a9435d7ee7ed5000496b190",
      "yazar": "James Gleick",
      "tr": "Bilgisayar programları, bugüne kadar insan endüstrisinin tüm ürünleri arasında en karmaşık, en hassas şekilde dengelenmiş ve en ince şekilde iç içe geçmiş olanlardır."
    },
    {
      "id": "5a9435fbee7ed5000496b191",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Soyutlama güçlerinin etkin bir şekilde kullanılması, yetkin bir programcının en hayati faaliyetlerinden biri olarak görülmelidir."
    },
    {
      "id": "5a943579ee7ed5000496b18e",
      "yazar": "Alan Perlis",
      "tr": "Aptallar karmaşıklığı görmezden gelir. Pragmatistler bundan muzdariptir. Bazıları bundan kaçınabilir. Dahiler onu ortadan kaldırır."
    },
    {
      "id": "5a943675ee7ed5000496b193",
      "yazar": "Hal Abelson",
      "tr": "Programlar, insanların okuması için ve yalnızca tesadüfen makinelerin çalışması için yazılmalıdır."
    },
    {
      "id": "5a943612ee7ed5000496b192",
      "yazar": "Mark Gibbs",
      "tr": "Provada demo ne kadar ustalıklı olursa olsun, canlı bir seyirci önünde yaptığınızda, kusursuz bir sunumun gerçekleşme olasılığı, izleyen kişi sayısıyla ters orantılıdır, gösterim miktarının gücüne yükseltilmiştir. ilgili para."
    },
    {
      "id": "5a956c50e648470004c69e0d",
      "yazar": "Nathaniel Borenstein",
      "tr": "Etik olarak eğitilmiş hiçbir yazılım mühendisinin bir DestroyBaghdad prosedürü yazmaya asla rıza göstermeyeceğine dikkat edilmelidir. Temel mesleki etik, onun yerine onun bir DestroyCity prosedürü yazmasını gerektirir, buna Bağdat parametre olarak verilebilir."
    },
    {
      "id": "5a956e55e648470004c69e10",
      "yazar": "Jef Raskin",
      "tr": "Bir süreci anlamadığımızda, sonuçlar hakkında sihirli düşüncelere kapılırız."
    },
    {
      "id": "5a956de5e648470004c69e0f",
      "yazar": "John Carmack",
      "tr": "Düşük seviyeli programlama, programcının ruhuna iyi gelir."
    },
    {
      "id": "5a956edfe648470004c69e11",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Sadelik ve zarafet popüler değil çünkü elde etmek için sıkı çalışma ve disiplin ve takdir edilmek için eğitim gerekiyor."
    },
    {
      "id": "5a956f87e648470004c69e12",
      "yazar": "Ted Nelson",
      "tr": "Kullanıcı arayüzü, acil bir durumda yeni başlayan birinin 10 saniye içinde anlayabileceği kadar basit olmalıdır."
    },
    {
      "id": "5a956dcce648470004c69e0e",
      "yazar": "Ted Nelson",
      "tr": "Dokunmayı öğrenmek şiir yazmakla ne ilgisi varsa, programlamayı öğrenmek etkileşimli yazılım tasarlamakla daha fazla ilgili değildir."
    },
    {
      "id": "5a95a672cb1a4d0004b2987f",
      "yazar": "Alan Perlis",
      "tr": "Her programın (en az) iki amacı vardır: Biri için yazıldığı ve diğeri için yazılmadığı."
    },
    {
      "id": "5a95a6a3cb1a4d0004b29881",
      "yazar": "Alan Perlis",
      "tr": "İnsan-makine simbiyozunda uyum sağlaması gereken insandır: Makineler yapamaz."
    },
    {
      "id": "5a95a686cb1a4d0004b29880",
      "yazar": "Alan Perlis",
      "tr": "Bir adamın sabiti başka bir adamın değişkenidir."
    },
    {
      "id": "5a9432bcee7ed5000496b17f",
      "yazar": "Bill Gates",
      "tr": "Başarı berbat bir öğretmendir. Akıllı insanları kaybedemeyeceklerini düşünmeye sevk eder."
    },
    {
      "id": "5a95a760cb1a4d0004b29883",
      "yazar": "Alan Perlis",
      "tr": "Spesifikasyonu programa uyacak şekilde değiştirmek, tersinden daha kolaydır."
    },
    {
      "id": "5a95a6f3cb1a4d0004b29882",
      "yazar": "Alan Perlis",
      "tr": "İnsanların yetersiz program yapmasının kaçınılmaz olduğunu düşünüyorum. Eğitim önemli ölçüde yardımcı olmayacak. Bununla yaşamayı öğrenmeliyiz."
    },
    {
      "id": "5a95d22e7700780004d51dbb",
      "yazar": "Henry Ford",
      "tr": "Müşterilere ne istediklerini sorsaydık daha hızlı atlar derlerdi."
    },
    {
      "id": "5a95d2487700780004d51dbc",
      "yazar": "David Parnas",
      "tr": "Birçok insanın yapay zekayla ilgilenmesinin nedeninin, birçok insanın yapay uzuvlarla ilgilenmesiyle aynı neden olduğunu buldum: Bir tanesi eksik."
    },
    {
      "id": "5a95d2a57700780004d51dbd",
      "yazar": "Leslie Lamport",
      "tr": "Dağıtılmış bir sistem, var olduğunu bile bilmediğiniz bir bilgisayarın arızalanmasının kendi bilgisayarınızı kullanılamaz hale getirebileceği bir sistemdir."
    },
    {
      "id": "5a95d3a37700780004d51dbe",
      "yazar": "Ward Cunningham",
      "tr": "Kod çalışana kadar her şey konuşulur."
    },
    {
      "id": "5a95d4127700780004d51dbf",
      "yazar": "Jan LA van de Snepscheut",
      "tr": "Teoride teori ile pratik arasında fark yoktur. Ama pratikte vardır."
    },
    {
      "id": "5a95d4977700780004d51dc2",
      "yazar": "Ellen Ullman",
      "tr": "Bilgisayar sistemlerimizi şehirlerimizi inşa ettiğimiz gibi inşa ediyoruz: zamanla, plansız, harabelerin üzerine."
    },
    {
      "id": "5a95d55e7700780004d51dc3",
      "yazar": "Eric S. Raymond",
      "tr": "İyi fikirlere sahip olmanın bir sonraki en iyi yanı, kullanıcılarınızdan gelen iyi fikirleri tanımaktır."
    },
    {
      "id": "5a95d43e7700780004d51dc0",
      "yazar": "Joel Spolsky",
      "tr": "İyi yazılım, iyi şarap gibi zaman alır."
    },
    {
      "id": "5a95d5bf7700780004d51dc4",
      "yazar": "Eric S. Raymond",
      "tr": "Lisp, sonunda onu elde ettiğinizde yaşayacağınız derin aydınlanma deneyimi için öğrenmeye değer; bu deneyim, Lisp'i asla çok fazla kullanmasanız bile, günlerinizin geri kalanında sizi daha iyi bir programcı yapacaktır."
    },
    {
      "id": "5a95d4577700780004d51dc1",
      "yazar": "Filipe Fortes",
      "tr": "Hata ayıklama, sizin de katil olduğunuz bir suç filminde dedektif olmaya benzer."
    },
    {
      "id": "5a95d8a87700780004d51dc7",
      "yazar": "Dennis Ritchie",
      "tr": "Korumak istediğimiz sadece programlama yapmak için iyi bir ortam değil, aynı zamanda dostlukların oluşabileceği bir sistemdi."
    },
    {
      "id": "5a95d7b47700780004d51dc6",
      "yazar": "Marvin Minsky",
      "tr": "Bilgisayarlar bir kez kontrolü ele geçirdiğinde, onu bir daha asla geri alamayabiliriz."
    },
    {
      "id": "5a95e89f7700780004d51dc9",
      "yazar": "Jef Raskin",
      "tr": "Bilgisayar, zamanınızı boşa harcamamalı veya kesinlikle gerekli olandan daha fazla iş yapmanızı gerektirmemelidir."
    },
    {
      "id": "5a95fcd17700780004d51dcb",
      "yazar": "George Boole",
      "tr": "Sahte kültürün birçok biçiminden, soyutlamalarla erken bir sohbet, belki de erkeksi bir zeka gücünün büyümesi için ölümcül olduğunu kanıtlama olasılığı en yüksek olanıdır."
    },
    {
      "id": "5a95dae97700780004d51dc8",
      "yazar": "Ken Thompson",
      "tr": "C++ kesinlikle iyi yönleri var. Ama genel olarak kötü bir dil olduğunu düşünüyorum. Pek çok şeyi yarı iyi yapıyor ve sadece birbirini dışlayan bir çöp yığını. Çok büyük, çok çok karmaşık. Ve belli ki bir komite tarafından inşa edilmiş."
    },
    {
      "id": "5a95fce07700780004d51dcc",
      "yazar": "George Boole",
      "tr": "Bir matematik teoremi ne kadar doğru görünürse görünsün, aynı zamanda güzel olduğu izlenimini verene kadar, onda mükemmel olmayan bir şey olmadığı konusunda asla tatmin olmamalıdır."
    },
    {
      "id": "5a96009b7700780004d51dcf",
      "yazar": "Ada Lovelace",
      "tr": "Analitik Motor, yalnızca 'hesaplama makineleri' ile ortak bir paydada bulunmaz. Tamamen kendine ait bir konuma sahiptir ve öne sürdüğü düşünceler doğası gereği daha ilginçtir."
    },
    {
      "id": "5a96001a7700780004d51dce",
      "yazar": "Ada Lovelace",
      "tr": "Özellikle matematikten türetilen işlemler bilimi, kendi başına bir bilimdir ve kendi soyut gerçekliği ve değeri vardır."
    },
    {
      "id": "5a9601017700780004d51dd1",
      "yazar": "Ada Lovelace",
      "tr": "Analitik Motor durumunda, kuşkusuz belirli bir hatta belirli bir analitik emek sermayesi yatırmamız gerekir, ancak bu, motorun bize başka bir hatta çok daha büyük bir getiri getirebilmesi içindir. "
    },
    {
      "id": "5a9600ae7700780004d51dd0",
      "yazar": "Ada Lovelace",
      "tr": "En uygun şekilde, Jakarlı dokuma tezgahının çiçekleri ve yaprakları ördüğü gibi Analitik Makinenin de cebirsel desenler ördüğünü söyleyebiliriz."
    },
    {
      "id": "5a9602227700780004d51dd2",
      "yazar": "George Boole",
      "tr": "Aşağıdaki incelemenin tasarımı, akıl yürütmenin gerçekleştirildiği zihnin bu işlemlerinin temel yasalarını araştırmak, bunları bir Kalkülüs'ün sembolik dilinde ifade etmek ve bu temel üzerine bilimi kurmaktır. Mantık ve yöntemini inşa et."
    },
    {
      "id": "5a967d572ba98a0004b6294f",
      "yazar": "John von Neumann",
      "tr": "Rastgele rakamlar üretmenin aritmetik yöntemlerini düşünen biri, elbette günah içindedir. Çünkü, birkaç kez belirtildiği gibi, rastgele sayı diye bir şey yoktur."
    },
    {
      "id": "5a9602757700780004d51dd3",
      "yazar": "George Boole",
      "tr": "Zihnin genel muhakemedeki işlemleri ile özel Cebir bilimindeki işlemleri arasında yalnızca yakın bir benzerlik yoktur, aynı zamanda iki sınıfın kullandığı yasalarda önemli ölçüde kesin bir anlaşma vardır. operasyonlar yapılıyor."
    },
    {
      "id": "5a967e9c2ba98a0004b62950",
      "yazar": "John von Neumann",
      "tr": "Yararlı hale gelen matematiğin büyük bir kısmı, kesinlikle yararlı olma arzusu olmadan ve kimsenin hangi alanda yararlı olacağını bilemeyeceği bir durumda geliştirildi."
    },
    {
      "id": "5a96b8e2d6959500047aecae",
      "yazar": "Friedrich Bauer",
      "tr": "Yazılım mühendisliği, bilgisayar biliminin bilgisayar bilimcisi için çok zor olan bölümüdür."
    },
    {
      "id": "5a96b909d6959500047aecaf",
      "yazar": "Grady Booch",
      "tr": "Amatör yazılım mühendisi her zaman sihir, uygulaması yazılım geliştirmeyi önemsiz kılmayı vaat eden sansasyonel bir yöntem veya araç arayışındadır. Böyle bir derde deva olmadığını bilmek profesyonel yazılım mühendisinin işaretidir."
    },
    {
      "id": "5a96b980d6959500047aecb0",
      "yazar": "Grady Booch",
      "tr": "İyi bir sürece sahip iyi insanlar, her zaman süreci olmayan iyi insanlardan daha iyi performans gösterir."
    },
    {
      "id": "5a96b998d6959500047aecb1",
      "yazar": "Grady Booch",
      "tr": "Yazılım mühendisliğinin tüm tarihi, soyutlama seviyelerindeki artıştan ibarettir."
    },
    {
      "id": "5a96b9ead6959500047aecb2",
      "yazar": "Hal Abelson",
      "tr": "Bilgisayar biliminin bilgisayarlarla ilgili olduğunu düşünmemizin nedeni, Mısırlıların geometrinin ölçme aletleriyle ilgili olduğunu düşünmeleriyle hemen hemen aynı nedendir: bir alan daha yeni başladığında ve siz onu gerçekten çok iyi anlamadığınızda, bu yaptığınız şeyin özünü kullandığınız araçlarla karıştırmak çok kolay."
    },
    {
      "id": "5a96b7abd6959500047aecad",
      "yazar": "Alan Kay",
      "tr": "Bugünkü yazılımların çoğu, yapısal bütünlüğü olmayan, ancak kaba kuvvet ve binlerce köle tarafından yapılan milyonlarca tuğlanın üst üste yığıldığı bir Mısır piramidi gibidir."
    },
    {
      "id": "5a96ba01d6959500047aecb3",
      "yazar": "Bill Gates",
      "tr": "Programcı olmaya hazırlanmanın en iyi yolu bilgisayar bilimi okumak mı? Hayır. Hazırlanmanın en iyi yolu programlar yazmak ve diğer insanların yazdığı harika programları incelemektir."
    },
    {
      "id": "5a96ba30d6959500047aecb4",
      "yazar": "Richard Feynman",
      "tr": "Bilgisayar bilimi, aslında bir bilim olmadığı için fizikten farklıdır. Doğal nesneleri incelemez. Aksine, bilgisayar bilimi mühendislik gibidir; her şey bir şeyler yapmak için bir şeyler elde etmekle ilgilidir."
    },
    {
      "id": "5a96ba45d6959500047aecb5",
      "yazar": "Richard Hamming",
      "tr": "Bilgi işlemin amacı, sayılar değil, içgörüdür."
    },
    {
      "id": "5a96bb2dd6959500047aecb7",
      "yazar": "Albert Einstein",
      "tr": "Yüce teknolojik ilerlememizin tümü, bu konuda medeniyet, patolojik bir suçlunun elindeki bir baltayla karşılaştırılabilir."
    },
    {
      "id": "5a96bbaed6959500047aecb8",
      "yazar": "Arthur C. Clarke",
      "tr": "Seçkin ancak yaşlı bir bilim adamı bir şeyin mümkün olduğunu söylediğinde, neredeyse kesinlikle haklıdır. Bir şeyin imkansız olduğunu söylediğinde, büyük olasılıkla yanılıyorlar."
    },
    {
      "id": "5a96ba93d6959500047aecb6",
      "yazar": "Dennis Ritchie",
      "tr": "Bilgisayar bilimi araştırması bu daha geleneksel disiplinlerden farklıdır. Felsefi olarak fizik bilimlerinden farklıdır çünkü doğal dünyayı keşfetmeye, açıklamaya veya sömürmeye değil, bunun yerine insan yaratımı makinelerinin özelliklerini incelemeye çalışır. "
    },
    {
      "id": "5a96bbc3d6959500047aecb9",
      "yazar": "Arthur C. Clarke",
      "tr": "Yeterince gelişmiş herhangi bir teknoloji sihirden ayırt edilemez."
    },
    {
      "id": "5a96bd31d6959500047aecba",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Üst düzey yazılım mimari modellerine çok fazla ilgi gösterilmiş olsa da, aslında fiili standart yazılım mimarisinin ne olduğu nadiren tartışılır: Büyük Çamur Topu."
    },
    {
      "id": "5a96bd7ed6959500047aecbb",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Yazılım sistemlerimizin çoğu mimari olarak gecekondu mahallelerinden biraz daha fazlası."
    },
    {
      "id": "5a96be8ed6959500047aecbe",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Büyük bir projeyi yönetmek, küçük bir projeyi yönetmekten niteliksel olarak farklı bir sorundur, tıpkı bir piyade tümeni savaşa yönlendirmenin küçük bir özel kuvvetler ekibine komuta etmekten farklı olması gibi."
    },
    {
      "id": "5a96bf70d6959500047aecc2",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Bir prototip oluşturduğunuzda, her zaman birisinin bu yeterince iyi, gönderin deme riski vardır. Bir prototipin üretime alınma riskini en aza indirmenin bir yolu, prototipi şuraya yazmaktır: üretim sürümü için muhtemelen kullanamayacağınız bir dil veya araç kullanmak."
    },
    {
      "id": "5a96bec9d6959500047aecbf",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Ne yazık ki, mimariye o kadar uzun süredir değer biçilmiyor ki, birçok mühendis Büyük Çamur Topu ile yaşamı normal olarak görüyor."
    },
    {
      "id": "5a96bf99d6959500047aecc3",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Kullanılabilir kodla ilgili asıl sorun, kod atılmadığında ortaya çıkar."
    },
    {
      "id": "5a96c01dd6959500047aecc4",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Bazen bir sistemi atmak ve baştan başlamak daha kolaydır."
    },
    {
      "id": "5a96c299d6959500047aecc5",
      "yazar": "Eric S. Raymond",
      "tr": "Bilgisayar bilimi eğitimi kimseyi uzman bir programcı yapamaz, fırçaları ve pigmentleri incelemek de birini uzman bir ressam yapamaz."
    },
    {
      "id": "5a96c3b6d6959500047aecc7",
      "yazar": "Randall E. Stross",
      "tr": "En iyi programcılar, yalnızca iyi olanlardan marjinal olarak daha iyi değildir. Onlar, herhangi bir standartla ölçülen, büyüklük sırasına göre daha iyidir: kavramsal yaratıcılık, hız, tasarım ustalığı veya problem çözme yeteneği."
    },
    {
      "id": "5a96c380d6959500047aecc6",
      "yazar": "Alan Kay",
      "tr": "'Nesne Yönelimli' terimini icat ettim ve size söyleyebilirim ki aklımda C++ yoktu."
    },
    {
      "id": "5a96c44cd6959500047aecc9",
      "yazar": "Linus Torvalds",
      "tr": "Çoğu iyi programcı, programlamayı para almayı veya halktan övgü almayı bekledikleri için değil, programlamanın eğlenceli olduğu için yapar."
    },
    {
      "id": "5a97def55f624c00046e2103",
      "yazar": "Alan Perlis",
      "tr": "Eğitimciler, generaller, diyetisyenler, psikologlar ve veliler programı. Ordular, öğrenciler ve bazı toplumlar programlanır."
    },
    {
      "id": "5a96c431d6959500047aecc8",
      "yazar": "L. Peter Deutsch",
      "tr": "Tekrar etmek insanidir, yinelemek ilahidir."
    },
    {
      "id": "5a97dee55f624c00046e2102",
      "yazar": "Alan Perlis",
      "tr": "Bilgisayar tüm gücüne rağmen zorlu bir görev yöneticisidir. Programları doğru olmalı ve söylemek istediğimiz her ayrıntıda doğru söylenmelidir."
    },
    {
      "id": "5a97e0755f624c00046e2104",
      "yazar": "John Locke",
      "tr": "Aklın, basit fikirler üzerinde gücünü uyguladığı eylemleri başlıca şu üç şeydir: 1. Birkaç basit fikri tek bir bileşik fikirde birleştirmek ve böylece tüm karmaşık fikirleri yapmak. 2. İkincisi getirmektir. basit ya da karmaşık iki fikri bir araya getirmek ve bütün ilişki fikirlerini elde etmek için onları bir araya getirmeden, aynı anda bir görüş almak için onları birbiri ardına yerleştirmek 3. Üçüncüsü onları ayırmak. onlara gerçek varoluşlarında eşlik eden tüm diğer fikirlerden: buna soyutlama denir ve bu nedenle tüm genel fikirleri yapılır."
    },
    {
      "id": "5a97efdaccdfe50004febf35",
      "yazar": "Gerald Weinberg",
      "tr": "Program geliştiricileri kendi kodları konusunda bölgesel olmadığında ve başkalarını hataları ve potansiyel iyileştirmeleri aramaya teşvik ettiğinde, ilerleme önemli ölçüde hızlanır."
    },
    {
      "id": "5a97f196ccdfe50004febf37",
      "yazar": "Anonim",
      "tr": "Bir boole ile ilgili en iyi şey, yanılıyor olsanız bile, sadece birazcık uzaklaşmış olmanızdır."
    },
    {
      "id": "5a97f307ccdfe50004febf39",
      "yazar": "Richard E. Pattis",
      "tr": "Hata ayıklarken, acemiler düzeltici kod ekler; uzmanlar hatalı kodu kaldırır."
    },
    {
      "id": "5a97f324ccdfe50004febf3a",
      "yazar": "Douglas Crockford",
      "tr": "Yazmada önemli olduğu gibi programlamada da stilin önemli olduğu ortaya çıktı. Okumayı daha iyi hale getiriyor."
    },
    {
      "id": "5a97f363ccdfe50004febf3b",
      "yazar": "Douglas Crockford",
      "tr": "Bilgisayar programları, insanların yaptığı en karmaşık şeylerdir."
    },
    {
      "id": "5a97f4e1ccdfe50004febf3d",
      "yazar": "Douglas Crockford",
      "tr": "Çoğu programlama dili iyi ve kötü kısımlar içerir. Sadece iyi kısımları kullanarak ve kötü kısımlardan kaçınarak daha iyi programcı olabileceğimi keşfettim."
    },
    {
      "id": "5a97f510ccdfe50004febf3e",
      "yazar": "Douglas Crockford",
      "tr": "Programlara, bir karışıklık birikintisine düşmeden büyüyebilmeleri için yeterli yapıyı vermek için iyi bir mimari gereklidir."
    },
    {
      "id": "5a97f539ccdfe50004febf3f",
      "yazar": "Douglas Crockford",
      "tr": "JavaScript, dünyanın en yanlış anlaşılan programlama dilidir."
    },
    {
      "id": "5a97f5f2ccdfe50004febf41",
      "yazar": "Douglas Crockford",
      "tr": "JavaScript'te, dumanı tüten iyi niyetler ve gaflar yığını altında gömülü güzel, zarif, son derece etkileyici bir dil vardır."
    },
    {
      "id": "5a97f552ccdfe50004febf40",
      "yazar": "Douglas Crockford",
      "tr": "Yazılımın genellikle üretken ömrü boyunca değiştirilmesi beklenir. Bir doğru programı farklı bir doğru programa dönüştürme süreci son derece zordur."
    },
    {
      "id": "5a97f8c1ccdfe50004febf42",
      "yazar": "Eric S. Raymond",
      "tr": "Her iyi yazılım işi, bir geliştiricinin kişisel kaşıntısını kaşıyarak başlar."
    },
    {
      "kimlik": "5a9801011878b40004879f55",
      "yazar": "Anonim",
      "tr": "Projeyi yaptırabilirsiniz: Zamanında Yapıldı. Bütçeye Uygun Olarak Yapıldı. Düzgün Yapıldı - İki tane seçin."
    },
    {
      "id": "5a9801871878b40004879f56",
      "yazar": "Andy Hunt (yazar)",
      "tr": "Bilgisayarın kısa tarihinde hiç kimse bir parça mükemmel yazılım yazmadı. İlk olman pek olası değil."
    },
    {
      "id": "5a9801f61878b40004879f57",
      "yazar": "Steve Wozniak",
      "tr": "Pencereden atamayacağınız bir bilgisayara asla güvenmeyin."
    },
    {
      "id": "5a9800cd1878b40004879f54",
      "yazar": "Alan Kay",
      "tr": "Geleceği tahmin etmenin en iyi yolu onu icat etmektir."
    },
    {
      "kimlik": "5a9802611878b40004879f58",
      "yazar": "Martin Fowler",
      "tr": "Bugünün işini bugün yaptırabiliyorsan, ama bunu öyle bir şekilde yaparsan ki, yarının işini yarın yapamayacaksın, o zaman kaybedersin."
    },
    {
      "id": "5a9803171878b40004879f5a",
      "yazar": "Alan Turing",
      "tr": "Kodlar bir bilmecedir. Diğer oyunlar gibi bir oyun."
    },
    {
      "kimlik": "5a9802cb1878b40004879f59",
      "yazar": "Damian Conway",
      "tr": "Belgeleme, gelecekteki kendinize yazdığınız bir aşk mektubudur."
    },
    {
      "id": "5a95d17b7700780004d51dba",
      "yazar": "Bdale Garbee",
      "tr": "Hayat tescilli yazılımı çalıştırmak için çok kısa."
    },
    {
      "id": "5a98075b1878b40004879f5d",
      "yazar": "Martin Fowler",
      "tr": "Ne zaman kodun ne yaptığını anlamak için düşünmem gerektiğinde, bu anlayışı hemen daha belirgin hale getirmek için kodu yeniden düzenleyebilir miyim diye kendime soruyorum."
    },
    {
      "kimlik": "5a9803931878b40004879f5b",
      "yazar": "David Leinweber",
      "tr": "Birine bir program verirseniz bir günlüğüne, programlamayı öğretirseniz bir ömür boyu hayal kırıklığına uğratırsınız."
    },
    {
      "id": "5a9803be1878b40004879f5c",
      "yazar": "Mario Fusco",
      "tr": "Yazdığın kod seni programcı yapar. Sildiğin kod seni iyi biri yapar. Yazmak zorunda olmadığın kod seni harika biri yapar."
    },
    {
      "id": "5a98080e1878b40004879f5f",
      "yazar": "Addy Osmani",
      "tr": "Önce yap, sonra doğru yap, sonra daha iyisini yap."
    },
    {
      "id": "5a9808401878b40004879f60",
      "yazar": "John Carmack",
      "tr": "Bir özellik eklemenin maliyeti, yalnızca onu kodlamak için gereken süre değildir. Maliyet, gelecekteki genişlemeye bir engelin eklenmesini de içerir. İşin püf noktası, birbiriyle savaşmayan özellikleri seçmektir. "
    },
    {
      "id": "5a9808b71878b40004879f62",
      "yazar": "George Carrette",
      "tr": "Önce bilgisayar bilimini ve tüm teoriyi öğrenin. Ardından bir programlama stili geliştirin. Sonra tüm bunları unutun ve hackleyin."
    },
    {
      "id": "5a98090a1878b40004879f64",
      "yazar": "Anders Hejlsberg",
      "tr": "İnsanların size bunun yapılamayacağını söylemesi, bunun yapılamayacağı anlamına gelmez. Sadece yapamayacakları anlamına gelir."
    },
    {
      "id": "5a98096c1878b40004879f65",
      "yazar": "Dennis Ritchie",
      "tr": "Yeni bir programlama dili öğrenmenin tek yolu, içinde programlar yazmaktır."
    },
    {
      "id": "5a980ec71878b40004879f66",
      "yazar": "Manny Lehman (bilgisayar bilimcisi)",
      "tr": "Gelişmekte olan bir sistem, onu azaltmak için çalışma yapılmadığı sürece karmaşıklığını artırır."
    },
    {
      "id": "5a985b7ae93441000489b948",
      "yazar": "Robert C. Martin",
      "tr": "Temiz kod yazarken ne kadar yavaş yazarsan yaz, ortalığı karıştırırsan her zaman daha yavaş olursun."
    },
    {
      "id": "5a985bc7e93441000489b949",
      "yazar": "Rob Pike",
      "tr": "n küçük olduğunda süslü algoritmalar yavaştır ve n genellikle küçüktür."
    },
    {
      "kimlik": "5a985c91e93441000489b94a",
      "yazar": "Manuel Blum",
      "tr": "FA [sonlu otomatlar] ile TM [Turing makinesi] arasındaki tek fark, TM'nin FA'den farklı olarak kağıt ve kaleme sahip olmasıdır. Bir düşünün. Size yazmanın gücü hakkında bir şeyler söyler. "
    },
    {
      "kimlik": "5a985e7ae93441000489b94c",
      "yazar": "Alan Perlis",
      "tr": "Bir bilgisayarda doğal dil doğal değildir."
    },
    {
      "id": "5a985db5e93441000489b94b",
      "yazar": "Brian Cantwell Smith",
      "tr": "Bir şeyi uygulamış olman onu anladığın anlamına gelmez."
    },
    {
      "id": "5a9807b41878b40004879f5e",
      "yazar": "Douglas Crockford",
      "tr": "Bu neredeyse hiç olmaz, 'olur' demenin başka bir yolu."
    },
    {
      "id": "5a9860abe93441000489b94f",
      "yazar": "Donald Knuth",
      "tr": "Yukarıdaki koddaki hatalara dikkat edin; sadece doğruluğunu kanıtladım, denemedim."
    },
    {
      "kimlik": "5a986366e93441000489b951",
      "yazar": "Ivan Sutherland",
      "tr": "Dijital bir bilgisayara bağlı bir ekran bize fiziksel dünyada gerçekleştirilmesi mümkün olmayan kavramlara aşinalık kazanma şansı veriyor. Bu, matematiksel bir harikalar diyarına bakan bir camdır."
    },
    {
      "kimlik": "5a9911bb8cdbad0004955d02",
      "yazar": "Ralph Johnson (bilgisayar bilimcisi)",
      "tr": "Yazılımın yeniden kullanılabilir olması için önce kullanılabilir olması gerekir."
    },
    {
      "kimlik": "5a9912938cdbad0004955d04",
      "yazar": "Gordon Bell",
      "tr": "En ucuz, en hızlı ve en güvenilir bileşenler, orada olmayanlardır."
    },
    {
      "id": "5a9912248cdbad0004955d03",
      "yazar": "Anonim",
      "tr": "Özyinelemeyi anlamak için önce özyinelemeyi anlamak gerekir."
    },
    {
      "id": "5a9995789128a800040c7dfa",
      "yazar": "Don Norman",
      "tr": "Tasarımın en zor kısmı özellikleri dışarıda tutmaktır."
    },
    {
      "kimlik": "5a986021e93441000489b94e",
      "yazar": "Luciano Ramalho",
      "tr": "Erken soyutlama, erken optimizasyon kadar kötü."
    },
    {
      "id": "5a9995d29128a800040c7dfc",
      "yazar": "Fred Brooks",
      "tr": "Bir program oluşturmanın özünün çoğu, aslında belirtimin hatalarını ayıklamaktır."
    },
    {
      "id": "5a9997389128a800040c7dfd",
      "yazar": "Elon Musk",
      "tr": "Çalışması için kılavuza ihtiyaç duyan herhangi bir ürün bozuk."
    },
    {
      "id": "5a9995b89128a800040c7dfb",
      "yazar": "Kevlin Henney",
      "tr": "Bir programı açık ayrıntılarla tanımlama eylemi ve programlama eylemi bir ve aynıdır."
    },
    {
      "id": "5a9997929128a800040c7dfe",
      "yazar": "Elon Musk",
      "tr": "Bence entropinin senden yana olmadığını her zaman aklında tutmalısın."
    },
    {
      "id": "5a9997d79128a800040c7dff",
      "yazar": "Elon Musk",
      "tr": "CEO'nun ofisine giden yol CFO'nun ofisinden geçmemeli, pazarlama departmanından geçmemeli. Mühendislik ve tasarımdan geçmeli."
    },
    {
      "id": "5a9999f39128a800040c7e00",
      "yazar": "Elon Musk",
      "tr": "İnsanlar teknolojinin otomatik olarak geliştiğini düşündüklerinde yanılıyorlar. Bu otomatik olarak gelişmez. Yalnızca daha iyi hale getirmek için çok sayıda insan çok çalışırsa gelişir ve aslında, bence, kendi kendine bozulacaktır. , aslında."
    },
    {
      "id": "5a9a9c372bad9600044b6fb4",
      "yazar": "Elon Musk",
      "tr": "Yapay zeka ile şeytanı çağırıyoruz."
    },
    {
      "id": "5a9a9f7e2bad9600044b6fb6",
      "yazar": "Elon Musk",
      "tr": "AI, insan uygarlığının varlığı için temel bir risktir."
    },
    {
      "id": "5a9aa21b2bad9600044b6fba",
      "yazar": "Terry Winograd",
      "tr": "Programlamanın ana faaliyeti yeni bağımsız programların oluşturulması değil, mevcut programların entegrasyonu, değiştirilmesi ve açıklanmasıdır."
    },
    {
      "id": "5a9aaff32bad9600044b6fbd",
      "yazar": "Tim Berners-Lee",
      "tr": "Harika URI'ler değişmez."
    },
    {
      "id": "5a9aaf8e2bad9600044b6fbc",
      "yazar": "Tim Berners-Lee",
      "tr": "Evreka anı fikrine inanmıyorum. Bence bu bir efsane. Aslında Arşimet'in bu sorunu uzun zamandır düşündüğünden çok şüpheliyim."
    },
    {
      "id": "5a9ab0372bad9600044b6fbf",
      "yazar": "Tim Berners-Lee",
      "tr": "Web'i icat ettiğimde kimseden izin almam gerekmiyordu."
    },
    {
      "id": "5a9aa01d2bad9600044b6fb7",
      "yazar": "Elon Musk",
      "tr": "AI konusunda çok dikkatli olmamız gerekiyor. Potansiyel olarak nükleer bombalardan daha tehlikeli."
    },
    {
      "id": "5a9ab1802bad9600044b6fc1",
      "yazar": "Tim Berners-Lee",
      "tr": "Web'i sadece ihtiyacım olduğu için icat ettim, gerçekten, çünkü o kadar sinir bozucuydu ki çıkamadı."
    },
    {
      "id": "5a9ab1ac2bad9600044b6fc2",
      "yazar": "Tim Berners-Lee",
      "tr": "Bir bilgisayar korsanı olmak - terimi kullandığımda - yaratıcı ve harika şeyler yapan biri."
    },
    {
      "id": "5a9ab1fa2bad9600044b6fc3",
      "yazar": "Tim Berners-Lee",
      "tr": "Alan Adı Sunucusu (DNS), Web'in Aşil topuğudur."
    },
    {
      "id": "5a9ab3f52bad9600044b6fc4",
      "yazar": "Vannevar Bush",
      "tr": "İki yüzyıl önce Leibnitz, en son klavye cihazlarının temel özelliklerinin çoğunu bünyesinde barındıran bir hesaplama makinesi icat etti, ancak o zaman kullanıma giremedi. Durumun ekonomisi buna karşıydı."
    },
    {
      "id": "5a9ab4a82bad9600044b6fc5",
      "yazar": "Vannevar Bush",
      "tr": "Mantıksal düşünce süreçleri kullanıldığında, makine için bir fırsat vardır."
    },
    {
      "id": "5a9ab8f42bad9600044b6fc6",
      "yazar": "Vannevar Bush",
      "tr": "Bilimsel akıl yürütme, aritmetiğin mantıksal süreçleriyle sınırlı olsaydı, fiziksel dünyayı anlamamızda çok ileri gitmemeliydik. olasılık."
    },
    {
      "id": "5a9ac42b2bad9600044b6fc7",
      "yazar": "Ward Cunningham",
      "tr": "İlk kez kod göndermek borca girmek gibidir. Küçük bir borç, derhal yeniden yazılarak geri ödendiği sürece gelişmeyi hızlandırır. Tehlike, borç geri ödenmediğinde ortaya çıkar. Harcanan her dakika-- doğru kod o borcun faizi sayılır. Teknik borç yükü altında tüm mühendislik organizasyonları durma noktasına getirilebilir."
    },
    {
      "id": "5a9ac4852bad9600044b6fc8",
      "yazar": "Martin Fowler",
      "tr": "Finansal borç gibi, teknik borç da hızlı ve kirli tasarım seçimi nedeniyle gelecekteki geliştirmede yapmamız gereken ekstra çaba şeklinde gelen faiz ödemelerine neden olur."
    },
    {
      "id": "5a9ac5942bad9600044b6fc9",
      "yazar": "Steve McConnell",
      "tr": "Teknik borcun önemli sonuçlarından biri, ödenmesi gerektiğidir. Borç yeterince büyürse, sonunda şirket, diğer varlıklarının değerini artırmaya yatırım yaptığından daha fazlasını borcunu ödemek için harcayacaktır."
    },
    {
      "id": "5a9ab0622bad9600044b6fc0",
      "yazar": "Tim Berners-Lee",
      "tr": "Benim açımdan çok önemli olan tek bir ağın olması. Onu ikiye bölmeye çalışan herkes kendi parçasının çok sıkıcı göründüğünü görecek."
    },
    {
      "id": "5a9b0b112bad9600044b6fca",
      "yazar": "Rene Descartes",
      "tr": "Dolayısıyla, tek bir mimarın planlayıp uyguladığı binaların, çoğu kişinin iyileştirmeye çalıştığı binalardan genellikle daha zarif ve ferah olduğu gözlemlenebilir."
    },
    {
      "id": "5a9b0b752bad9600044b6fcb",
      "yazar": "Danny Hillis",
      "tr": "Bilgisayarlar, insanoğlunun şimdiye kadar yarattığı en karmaşık nesnelerdir, ancak temel anlamda son derece basittirler."
    },
    {
      "id": "5a9b0bb22bad9600044b6fcd",
      "yazar": "Danny Hillis",
      "tr": "Bir bilgisayarın büyüsü, tam olarak ne olduğunu açıklayabildiğiniz sürece, hayal edebileceğiniz hemen hemen her şeye dönüşme yeteneğinde yatar."
    },
    {
      "id": "5a9b0b9a2bad9600044b6fcc",
      "yazar": "Danny Hillis",
      "tr": "Bilgisayar sadece gelişmiş bir hesap makinesi, kamera veya boya fırçası değil, düşünce süreçlerimizi hızlandıran ve genişleten bir cihazdır."
    },
    {
      "id": "5a9b0bce2bad9600044b6fce",
      "yazar": "Danny Hillis",
      "tr": "Doğru programlama ile bir bilgisayar bir tiyatro, bir müzik aleti, bir referans kitabı, bir satranç rakibi olabilir. Dünyada insan dışında başka hiçbir varlık bu kadar uyumlu, evrensel bir yapıya sahip değildir."
    },
    {
      "id": "5a9b0c2f2bad9600044b6fcf",
      "yazar": "Danny Hillis",
      "tr": "Daha önce bir program yazmış olan herkes, bir bilgisayara ne yapmak istediğinizi söylemenin göründüğü kadar kolay olmadığını bilir. Bilgisayarın istenen çalışmasının her ayrıntısı tam olarak tanımlanmalıdır. Örneğin, Müşterilerinize her birinin borçlu olduğu tutarı faturalandırmak için muhasebe programı, daha sonra bilgisayar hiçbir borcu olmayan müşterilere 0,00 ABD doları tutarında haftalık bir fatura gönderir."
    },
    {
      "id": "5a9b0c4b2bad9600044b6fd0",
      "yazar": "Danny Hillis",
      "tr": "Yetenekli bir programcı, başkalarının ifade edilemez bulduğu fikirleri kelimelere dökebilen bir şair gibidir."
    },
    {
      "id": "5a9b0c6b2bad9600044b6fd1",
      "yazar": "Danny Hillis",
      "tr": "Her bilgisayar dilinin Shakespeare'leri vardır ve kodlarını okumak bir zevktir. İyi yazılmış bir bilgisayar programı bir stile, inceliğe, hatta mizaha ve en iyi düzyazıya rakip olacak bir netliğe sahiptir."
    },
    {
      "id": "5a9b0c932bad9600044b6fd2",
      "yazar": "Danny Hillis",
      "tr": "Sonsuz bir döngü ile ölümcül bir şekilde bulaşıp bulaşmadığını belirlemek için bir programı incelemek ve belirlemek için bir algoritma olmadığı ortaya çıktı. Üstelik, henüz hiç kimse böyle bir algoritma keşfetmedi değil, daha doğrusu böyle bir algoritma yok mümkün."
    },
    {
      "id": "5a9b0cc62bad9600044b6fd3",
      "yazar": "Danny Hillis",
      "tr": "Dijital bir bilgisayar tarafından hesaplanabilen problemler sınıfı, görünüşe göre herhangi bir cihaz tarafından hesaplanabilen her problemi içerir."
    },
    {
      "id": "5a9b0d662bad9600044b6fd5",
      "yazar": "Hal Abelson",
      "tr": "Süreçler oluşturmak için kullandığımız programlar bir büyücünün büyüsü gibidir. Bunlar, süreçlerimizin gerçekleştirmesini istediğimiz görevleri belirleyen gizemli ve ezoterik programlama dillerindeki sembolik ifadelerden özenle oluşturulmuştur."
    },
    {
      "id": "5a9b10db2bad9600044b6fd7",
      "yazar": "Fred Brooks",
      "tr": "İnsanlar mükemmel olmaya alışık değildir ve insan faaliyetinin çok az alanı bunu gerektirir. Mükemmellik gereksinimine uyum sağlamak bence programlamayı öğrenmenin en zor kısmıdır."
    },
    {
      "id": "5a9b131f2bad9600044b6fd9",
      "yazar": "Fred Brooks",
      "tr": "İyimserlik nedeniyle, genellikle hata sayısının göründüğünden daha küçük olmasını bekleriz. Bu nedenle testler genellikle programlamanın en yanlış planlanmış kısmıdır."
    },
    {
      "id": "5a9b0d9c2bad9600044b6fd6",
      "yazar": "Danny Hillis",
      "tr": "Bilgisayar programlamanın en büyük zevklerinden biri, bir şey yapmak için yeni, daha hızlı ve daha verimli bir algoritma keşfetmektir - özellikle de birçok saygın insan daha kötü çözümler bulmuşsa."
    },
    {
      "id": "5a9b13442bad9600044b6fda",
      "yazar": "Fred Brooks",
      "tr": "Kullanıcının istediği tarihi eşleştirmek için yanlış zamanlama, bizim disiplinimizde mühendisliğin başka yerlerinde olduğundan çok daha yaygındır."
    },
    {
      "id": "5a9b14c12bad9600044b6fdb",
      "yazar": "Robert L. Glass",
      "tr": "Bireysel farklılıklar araştırmasına göre en iyi programcılar en kötü programcılardan 28 kata kadar daha iyidir. Ücretlerinin hiçbir zaman orantılı olmadığı düşünüldüğünde, yazılım alanındaki en büyük pazarlıklar onlar."
    },
    {
      "id": "5a9b154e2bad9600044b6fdc",
      "yazar": "Fred Brooks",
      "tr": "Sackman, Erickson ve Grant bir grup deneyimli programcının performansını ölçüyorlardı. Sadece bu grup içinde en iyi ve en kötü performans arasındaki oranlar verimlilik ölçümlerinde ortalama 10:1 ve program hızında inanılmaz 5:1 idi. ve uzay ölçümleri!"
    },
    {
      "id": "5a9b15cb2bad9600044b6fdd",
      "yazar": "Fred Brooks",
      "tr": "Kavramsal bütünlük, sistem tasarımında en önemli husustur. Bir sisteme sahip olmak, belirli anormal özellikleri ve iyileştirmeleri hariç tutmak, ancak bir dizi tasarım fikrini yansıtmak, pek çok iyi ama bağımsız ve bağımsız içeren bir sisteme sahip olmaktan daha iyidir. koordine olmayan fikirler."
    },
    {
      "id": "5a9b15e52bad9600044b6fde",
      "yazar": "Fred Brooks",
      "tr": "Mimari çabanın uygulamadan ayrılması, çok büyük projelerde kavramsal bütünlük elde etmenin çok güçlü bir yoludur."
    },
    {
      "id": "5a9b16122bad9600044b6fdf",
      "yazar": "Fred Brooks",
      "tr": "Genel eğilim, ilkinde ihtiyatlı bir şekilde gözden kaçan tüm fikirleri ve gösterişleri kullanarak ikinci sistemi aşırı tasarlamaktır."
    },
    {
      "id": "5a9b16922bad9600044b6fe2",
      "yazar": "Fred Brooks",
      "tr": "Yönetim sorusu, bu nedenle, bir pilot sistem kurup atmak değil, bunu yapacaksınız. Tek soru, atılacak bir sistem inşa etmeyi önceden planlamak mı yoksa atılanı teslim etmeye söz vermek mi? müşterilere."
    },
    {
      "id": "5a9b17542bad9600044b6fe4",
      "yazar": "Fred Brooks",
      "tr": "Program oluşturma entropi azaltan bir süreçtir, bu nedenle doğası gereği yarı kararlıdır. Program bakımı entropi artıran bir süreçtir ve en ustaca yürütülmesi bile sistemin yalnızca onarılamaz eskimeye dönüşmesini geciktirir."
    },
    {
      "id": "5a9b16792bad9600044b6fe1",
      "yazar": "Fred Brooks",
      "tr": "Kimya mühendisleri, laboratuvarda işleyen bir işlemin bir fabrikada tek adımda uygulanamayacağını çok önce öğrendi."
    },
    {
      "id": "5a9b17f92bad9600044b6fe7",
      "yazar": "Fred Brooks",
      "tr": "İlk olarak, anormalliğin yazılım ilerlemesinin çok yavaş olması değil, bilgisayar donanımının ilerlemesinin çok hızlı olması olduğunu gözlemlemeliyiz. Uygarlığın başlangıcından bu yana başka hiçbir teknoloji 30 yılda altı kat fiyat-performans artışı görmedi. "
    },
    {
      "id": "5a9b17a22bad9600044b6fe6",
      "yazar": "Fred Brooks",
      "tr": "Kodlama, toplam kodlama süresinin yarısı için \"yüzde 90 tamamlandı\". Hata ayıklama çoğu zaman \"yüzde 99 tamamlandı\"."
    },
    {
      "id": "5a9b18102bad9600044b6fe8",
      "yazar": "Fred Brooks",
      "tr": "Yazılımın karmaşıklığı, tesadüfi değil, temel bir özelliktir. Bu nedenle, karmaşıklığını soyutlayan bir yazılım varlığının tanımları genellikle özünü soyutlar."
    },
    {
      "id": "5a9b189c2bad9600044b6fea",
      "yazar": "Fred Brooks",
      "tr": "Araştırmalar, en iyi tasarımcıların daha hızlı, daha küçük, daha basit, daha temiz ve daha az çabayla üretilmiş yapılar ürettiğini gösteriyor. Büyük ve ortalama arasındaki farklar bir büyüklük sırasına yaklaşıyor."
    },
    {
      "id": "5a9b18d52bad9600044b6fec",
      "yazar": "Fred Brooks",
      "tr": "Bir programlama sistemleri ürünü, özel kullanım için ayrı olarak yazılmış bileşen programlarından yaklaşık dokuz kat daha fazla çaba gerektirir."
    },
    {
      "id": "5a9b190a2bad9600044b6fed",
      "yazar": "Fred Brooks",
      "tr": "Temel kuralım, programın 1/3'ü tasarım, 1/6 kodlama, 1/4 bileşen testi ve 1/4 sistem testidir."
    },
    {
      "id": "5a9b18bf2bad9600044b6feb",
      "yazar": "Fred Brooks",
      "tr": "Birincisi, karım, meslektaşlarım ve editörlerim kötümserlikten çok iyimserlikte hata yaptığımı düşünüyorlar. Sonuçta ben bir programcıyım ve iyimserlik zanaatımızın bir meslek hastalığıdır. "
    },
    {
      "id": "5a9b19232bad9600044b6fee",
      "yazar": "Fred Brooks",
      "tr": "Zamanlama tahminlerimizden emin olmadığımız için, genellikle onları yönetim ve müşteri baskısına karşı inatla savunmaya cesaret edemiyoruz."
    },
    {
      "id": "5a9b19422bad9600044b6fef",
      "yazar": "Fred Brooks",
      "tr": "Bir yazılım projesine insan eklemek, gerekli toplam çabayı üç şekilde artırır: kendini yeniden bölümlendirmenin çalışması ve kesintisi, yeni insanları eğitme ve ek iletişim."
    },
    {
      "id": "5a9b195a2bad9600044b6ff0",
      "yazar": "Fred Brooks",
      "tr": "Çok iyi profesyonel programcılar, aynı eğitim ve iki yıllık deneyim düzeyinde, fakir olanlara göre on kat daha üretkendir."
    },
    {
      "id": "5a9b198a2bad9600044b6ff2",
      "yazar": "Fred Brooks",
      "tr": "Programlama artışı, program boyutunun gücü olarak artar."
    },
    {
      "id": "5a9b1abf2bad9600044b6ff7",
      "yazar": "Daniel T. Barry",
      "tr": "Çeşitli araştırmalar, en uygun ekip boyutunun 2 ile 5 arasında olduğunu ve 3'ün mod olduğunu gösteriyor. 5'ten fazla ekip üyesi ile ekip yönetimi işe hakim olmaya başlar."
    },
    {
      "id": "5a9b1ce02bad9600044b6ff8",
      "yazar": "Daniel T. Barry",
      "tr": "Aptal bir hata, algoritmik olarak önlenebilir bir hatadır. Esasen, bir programın algılayabildiği bir hatanın algılanmamasına izin verirseniz aptal olursunuz."
    },
    {
      "id": "5a9b19dd2bad9600044b6ff4",
      "yazar": "Fred Brooks",
      "tr": "Tüm onarımlar, bir sistemin entropisini ve düzensizliğini artırmak için yapıyı yok etme eğilimindedir."
    },
    {
      "id": "5a9b1d7d2bad9600044b6ffa",
      "yazar": "Thomas J. Watson",
      "tr": "Bence belki beş\nbilgisayar için bir dünya pazarı var."
    },
    {
      "id": "5a9b1e082bad9600044b6ffb",
      "yazar": "Ken Olsen",
      "tr": "Kimsenin evinde bilgisayar istemesi için hiçbir neden yok."
    },
    {
      "id": "5a9b1eb02bad9600044b6ffc",
      "yazar": "Michael A. Jackson",
      "tr": "Bir programcı için bilgeliğin başlangıcı, programının işe yaraması ve doğru olması arasındaki farkı fark etmesidir."
    },
    {
      "id": "5a9b1ece2bad9600044b6ffd",
      "yazar": "Michael A. Jackson",
      "tr": "Gereksinimler hakkında bilinen iki şey var:\n1. Değişecekler!\n2. Yanlış anlaşılacaklar!"
    },
    {
      "id": "5a9b1f362bad9600044b6fff",
      "yazar": "Daniel T. Barry",
      "tr": "Süreci her iyileştirdiğinizde, iş daha da zorlaşır."
    },
    {
      "id": "5a9b1f592bad9600044b7000",
      "yazar": "Daniel T. Barry",
      "tr": "Doğru yapmak için asla yeterli zaman yoktur, ancak düzeltmek veya yeniden yapmak için her zaman yeterli zaman vardır."
    },
    {
      "id": "5a8e9be284a8f2000482568c",
      "yazar": "Zengin Skrenta",
      "tr": "Ne kadar çok kodunuz varsa, böceklerin saklanabileceği o kadar çok yer olur."
    },
    {
      "id": "5a97f062ccdfe50004febf36",
      "yazar": "Gerald Weinberg",
      "tr": "Eğer inşaatçılar, programcıların programları inşa ettiği gibi evler inşa etseydi, ortaya çıkan ilk ağaçkakan medeniyeti yok ederdi."
    },
    {
      "id": "5a9aa1db2bad9600044b6fb9",
      "yazar": "Terry Winograd",
      "tr": "İnsan sosyal etkileşimi için bürokrasi ne ise, zihin için de yapay zeka teknikleri odur."
    },
    {
      "id": "5a9b1f692bad9600044b7001",
      "yazar": "Daniel T. Barry",
      "tr": "Kodu değiştirmek pahalıdır, ancak tasarımı değiştirmek daha ucuzdur ve gereksinimleri değiştirmek daha da ucuzdur."
    },
    {
      "id": "5a9b1f822bad9600044b7002",
      "yazar": "Daniel T. Barry",
      "tr": "Proje tamamlanmaya ve ötesine doğru ilerledikçe bir hatayı düzeltme maliyeti önemli ölçüde artar."
    },
    {
      "id": "5a9b1f252bad9600044b6ffe",
      "yazar": "Daniel T. Barry",
      "tr": "Aynı zamanda son derece bölgesel, bencil politikacılar olan son derece yetkin programcılardan oluşan bir ekip başarısız olurken, aynı zamanda egosuz, işbirlikçi, takım oyuncuları olan eşit derecede yetkin programcılardan oluşan bir ekip başarılı olacak."
    },
    {
      "id": "5a9b203c2bad9600044b7004",
      "yazar": "Daniel T. Barry",
      "tr": "Çoğu yazılım için verimlilik önemli değildir."
    },
    {
      "id": "5a9b214b2bad9600044b7005",
      "yazar": "Harlan Mills",
      "tr": "Son hatayı bulduğunuzu bilmenin en iyi yolu asla ilk hatayı bulamamaktır."
    },
    {
      "id": "5a9b21cb2bad9600044b7008",
      "yazar": "Harlan Mills",
      "tr": "Etkileşimli bir hata ayıklayıcı, neye ihtiyaç duyulmadığına dair olağanüstü bir örnektir - sistematik tasarımdan ziyade deneme-yanılma yoluyla korsanlığı teşvik eder ve ayrıca hassas programlama için zar zor kalifiye olan marjinal insanları gizler."
    },
    {
      "id": "5a9b22a02bad9600044b7009",
      "yazar": "Daniel T. Barry",
      "tr": "Bir programı baştan sona test etmek imkansızdır (sınırsız sayıda test senaryosu gerektirir); bu nedenle tüm hataları ortaya çıkaracak test senaryoları seçmeye çalışın. Özellikle tüm hataların ne olduğunu bilmediğimiz için bu çok zordur ve eğer yaptık, test durumlarına ihtiyacımız olmayacaktı!"
    },
    {
      "id": "5a9b21a12bad9600044b7007",
      "yazar": "Harlan Mills",
      "tr": "Bir programda hataların meydana gelmesinin tek yolu, oraya yazar tarafından konulmasıdır. Bilinen başka mekanizma yoktur."
    },
    {
      "id": "5a9b22c72bad9600044b700b",
      "yazar": "Daniel T. Barry",
      "tr": "Güvenilir hesaplamalar, sonuçta var olan tek tür program olan buggy programlarından elde edilebilir."
    },
    {
      "id": "5a9b22ed2bad9600044b700c",
      "yazar": "David Parnas",
      "tr": "Böceklerimi dikkatlice seçmeme izin verirseniz, binlerce hata içeren güvenilir bir sistem kurabilirim."
    },
    {
      "id": "5a9b231d2bad9600044b700d",
      "yazar": "Daniel T. Barry",
      "tr": "IBM'den Ed Adams, güvenilirlik sorunlarının %80'inin kusurların yalnızca %2'sinden kaynaklandığını buldu."
    },
    {
      "id": "5a9b23502bad9600044b700e",
      "yazar": "Jim Horning",
      "tr": "Donanım değiştirebileceğiniz parçadır. Yazılım, saklamanız gereken parçadır, çünkü çok pahalıdır ve artık kimse onu anlamıyor."
    },
    {
      "id": "5a9b23dc2bad9600044b7011",
      "yazar": "Daniel T. Barry",
      "tr": "Belgelemeye zorlamak için herhangi bir teknolojik veya yönetim planı isteksiz programcılar tarafından altüst edilebilir."
    },
    {
      "id": "5a9b23b02bad9600044b700f",
      "yazar": "Jim Horning",
      "tr": "İyi yargı deneyimden gelir. Deneyim kötü yargıdan gelir."
    },
    {
      "id": "5a9c649eff6af300049e6b59",
      "yazar": "John McCarthy (bilgisayar bilimcisi)",
      "tr": "Termostatlar kadar basit makinelerin inançları olduğu söylenebilir."
    },
    {
      "id": "5a9b253f2bad9600044b7016",
      "yazar": "Tony Parisi (yazılım geliştiricisi)",
      "tr": "Bir çerçeve, ihtiyaç duyduğumuz özelliklerin %90'ını hızlı bir şekilde sağlayabilir - bize geliştirme döngüsünün başlarında yanlış bir güven duygusu verir - ve ardından, son %10'u uygulamak söz konusu olduğunda sinir bozucu bir şekilde zor olabilir."
    },
    {
      "id": "5a9c6502ff6af300049e6b5a",
      "yazar": "John McCarthy (bilgisayar bilimcisi)",
      "tr": "Aşk ve nefret gibi insana benzer güdüsel yapılara özgü zihinsel nitelikler akıllı davranış için gerekli olmayacak, ancak istersek bilgisayarları muhtemelen bunları sergileyecek şekilde programlayabiliriz."
    },
    {
      "id": "5a9d2f8c607c5100044dff77",
      "yazar": "Richard Stallman",
      "tr": "Bilgisayar bilimlerinde büyük bir programın kaynak kodunu hiç görmemiş parlak öğrencilerle tanıştım. Küçük programlar yazmakta iyi olabilirler, ancak büyük programlar yazmanın farklı becerilerini öğrenmeye başlayamazlar. başkalarının bunu nasıl yaptığını göremiyorlar."
    },
    {
      "id": "5a9c65d6ff6af300049e6b5b",
      "yazar": "John McCarthy (bilgisayar bilimcisi)",
      "tr": "Program tasarımcıları, kullanıcıları kontrol edilmesi gereken aptallar olarak düşünmeye meyillidirler. Programlarını, efendisi olan kullanıcının kontrol edebilmesi gereken bir hizmetçi olarak düşünmeleri gerekir."
    },
    {
      "id": "5a9d3007607c5100044dff79",
      "yazar": "Richard Stallman",
      "tr": "Aslında, 1980'lerde hayatlarında hiç gerçek bir program görmemiş yeni mezun bilgisayar bilimleri bölümleriyle sık sık karşılaştım. Onlar sadece oyuncak alıştırmaları, okul alıştırmaları görmüşlerdi, çünkü her gerçek program bir ticari sırdı. "
    },
    {
      "id": "5a9d31fa607c5100044dff7c",
      "yazar": "Richard Stallman",
      "tr": "Tescilli yazılım geliştiricileri, paylaşım yapmamızı engellemek için telif hakkını kullandığından, biz işbirlikçilerin, diğer işbirlikçilere kendilerine ait bir avantaj sağlamak için telif hakkını kullanabileceğimizi düşünüyorum: onlar bizim kodumuzu kullanabilirler."
    },
    {
      "id": "5a9d2eb2607c5100044dff75",
      "yazar": "Richard Stallman",
      "tr": "Altın kuralın, bir programı beğenirsem, onu beğenen diğer kişilerle paylaşmam gerektiğini gerektirdiğini düşünüyorum. Yazılım satıcıları, kullanıcıları bölmek ve onları fethetmek ister, her kullanıcının başkalarıyla paylaşmamayı kabul etmesini sağlar. Diğer kullanıcılarla dayanışmayı bu şekilde bozmayı reddediyorum."
    },
    {
      "id": "5a9d33ae607c5100044dff7d",
      "yazar": "Richard Stallman",
      "tr": "Özgür yazılım topluluğu, halkın teknolojinin nasıl çalıştığı konusunda bilgisiz kalmasına neden olan teknolojinin rahibeliğini reddeder;her yaştan ve durumdaki öğrencileri kaynak kodunu okumaya ve istedikleri kadar öğrenmeye teşvik ediyoruz.bilmek."
    },
    {
      "id": "5a9d3532607c5100044dff7e",
      "yazar": "Richard Stallman",
      "tr": "En güçlü programlama dili Lisp'tir. Lisp'i (veya onun türevi Scheme) bilmiyorsanız, bir programlama dilinin güçlü ve zarif olmasının ne anlama geldiğini de bilmiyorsunuz. Lisp'i bir kez öğrendikten sonra , diğer dillerin çoğunda neyin eksik olduğunu anlayacaksınız."
    },
    {
      "id": "5a9d36a4607c5100044dff7f",
      "yazar": "Richard Stallman",
      "tr": "Programlama programlamadır. Programlamada iyiyseniz, hangi dilde öğrendiğiniz önemli değil, çünkü herhangi bir dilde programlama yapabileceksiniz."
    },
    {
      "id": "5a9dc5de6744730004f6a1e6",
      "yazar": "Maurice Wilkes",
      "tr": "EDSAC odası ile delme ekipmanı arasındaki yolculuklarımdan birinde, hayatımın geri kalanının büyük bir bölümünün kendi programlarımdaki hataları bulmaya harcanacağının tüm gücüyle üzerime geldiğini anladım. "
    },
    {
      "id": "5a9dc65d6744730004f6a1e8",
      "yazar": "Maurice Wilkes",
      "tr": "1954'ten beri, bilgisayarların bir toplama yapmak için geçen süre ile ölçülen ham hızı 10.000 kat arttı. Bu, bir zamanlar 10 dakika süren bir algoritmanın şimdi 15 kez yapılabileceği anlamına geliyor. bir saniye."
    },
    {
      "id": "5a9dc8e76744730004f6a1e9",
      "yazar": "Richard Hamming",
      "tr": "Yazmak düşünmenin yerini tutmaz."
    },
    {
      "id": "5a9d530a1a29250004e946df",
      "yazar": "Donald Knuth",
      "tr": "Bilinçaltında kendini bir sanatçı olarak gören bir programcı yaptığı işten zevk alacak ve daha iyisini yapacak."
    },
    {
      "id": "5a9dc9c26744730004f6a1ea",
      "yazar": "Richard Hamming",
      "tr": "Belki de tüm bilgisayar bilimlerinde karşılaştığımız temel sorun, bu kadar çok şeyi önemsiz bir şekilde yeniden yapmak yerine başkalarının çalışmalarının üzerine inşa ettiğimiz duruma nasıl ulaşacağımızdır."
    },
    {
      "id": "5a9dcace6744730004f6a1eb",
      "yazar": "Richard Hamming",
      "tr": "Bugün matematik öğrenmek için herhangi bir isteksizlik, yarın olasılıklarınızı büyük ölçüde kısıtlayabilir."
    },
    {
      "id": "5aa28cf31dcf530004c4bf64",
      "yazar": "Charles Simonyi",
      "tr": "Gerçekten iyi programlar sonsuza kadar yaşar."
    },
    {
      "id": "5a9dccdd6744730004f6a1ec",
      "yazar": "Richard Hamming",
      "tr": "Bilimde ne yaptığını biliyorsan yapmamalısın. Mühendislikte ne yaptığını bilmiyorsan yapmamalısın."
    },
    {
      "id": "5aa28d721dcf530004c4bf65",
      "yazar": "Butler Lampson",
      "tr": "Kaynakları idare ederken, optimuma ulaşmak yerine felaketten kaçınmaya çalışın."
    },
    {
      "id": "5aa28ea11dcf530004c4bf67",
      "yazar": "John Warnock",
      "tr": "Çoğu projede olduğu gibi, son yüzde ikisi zamanın yüzde ellisini alır."
    },
    {
      "id": "5aa299fbe7e86700048f0279",
      "yazar": "Gary Kildall",
      "tr": "Bir terminalde oturup kodun akmasına izin vermek eğlenceli. Kulağa garip geliyor ama beynimden çıkıyor; bir kez başladığımda, bunun hakkında düşünmek zorunda değilim."
    },
    {
      "id": "5aa29b16e7e86700048f027a",
      "yazar": "Gary Kildall",
      "tr": "Bence programlama birçok insan için çok dini bir deneyim."
    },
    {
      "id": "5aa28c251dcf530004c4bf63",
      "yazar": "Charles Simonyi",
      "tr": "Programlama nedir? Bazıları buna bilim diyor, bazıları sanat diyor, bazıları beceri diyor. Bence üçünün de yönleri var."
    },
    {
      "id": "5aa29bfee7e86700048f027b",
      "yazar": "Bill Gates",
      "tr": "Harika bir programcıyla konuşursanız, onun aletlerini bir sanatçının boya fırçalarını bildiği gibi bildiğini göreceksiniz."
    },
    {
      "id": "5aa29c76e7e86700048f027c",
      "yazar": "Bill Gates",
      "tr": "Hedeflerimiz çok basit. Her masaya ve her eve bir bilgisayar koyan yazılımı oluşturacağız."
    },
    {
      "id": "5aa2a019e7e86700048f027f",
      "yazar": "Dan Bricklin",
      "tr": "Program yazmanın en önemli kısmı veri yapılarını tasarlamaktır."
    },
    {
      "id": "5aa2a0ace7e86700048f0280",
      "yazar": "Bob Frankston",
      "tr": "Fikirler kaybolmaz. Biçim değiştirirler, başka fikirlerle birleşirler."
    },
    {
      "id": "5aa2a355e7e86700048f0284",
      "yazar": "Peter Roizen",
      "tr": "Yalnızca kodun ne söylediğini değil, nasıl göründüğünü de önemsiyorum."
    },
    {
      "id": "5aa2a2f1e7e86700048f0283",
      "yazar": "Ray Ozzie",
      "tr": "Programlama, kurcalamayı seven biri için nihai alandır."
    },
    {
      "id": "5aa2a3fde7e86700048f0286",
      "yazar": "Bob Carr",
      "tr": "Programlama bağımlılık yapabilir."
    },
    {
      "id": "5aa2a3b3e7e86700048f0285",
      "yazar": "Bob Carr",
      "tr": "Sanatsal açıdan en iyi yazılım, sezgi alanından gelir."
    },
    {
      "id": "5aa2a602e7e86700048f0287",
      "yazar": "Andy Hertzfeld",
      "tr": "Sonra Apple 1980'lerin sonlarına doğru halka açıldı. Birdenbire birlikte çalıştığım tüm bu insanlar milyonerdi."
    },
    {
      "id": "5aa2a68ce7e86700048f0288",
      "yazar": "Toru Iwatani",
      "tr": "İnsanlarla iletişim kuran görüntüler oluşturmakla ilgileniyorum."
    },
    {
      "id": "5aa31172bb93c00004d9a6f6",
      "yazar": "Charles Simonyi",
      "tr": "Denetlemenin en iyi yolunun kişisel örnekler ve sık sık kod incelemeleri yapmak olduğunu düşünüyorum."
    },
    {
      "id": "5aa3181fbb93c00004d9a6f8",
      "yazar": "Butler Lampson",
      "tr": "Karmaşıklığı kontrol etmek için bazı temel teknikler vardır. Temel olarak, böler ve yönetirim, bir şeyleri parçalara ayırırım ve her bir parçanın ne yapması gerektiğine dair makul ölçüde kesin açıklamalar yazmaya çalışırım."
    },
    {
      "id": "5aa311f9bb93c00004d9a6f7",
      "yazar": "Charles Simonyi",
      "tr": "Program üzerinde çalışan kişi sayısı arttıkça kodun verimi düşer. En verimli programlar tek kişi tarafından yazılır."
    },
    {
      "id": "5aa30d4abb93c00004d9a6f5",
      "yazar": "Charles Simonyi",
      "tr": "Bahse girerim ki bir programın kötü olup olmadığını on metre öteden anlayabilirim. İyi olduğunu garanti edemem ama üç metreden kötü görünüyorsa, sana öyle olmadığını garanti edebilirim' özenle yazılmış."
    },
    {
      "id": "5aa44e197832df00040ac9b7",
      "yazar": "Butler Lampson",
      "tr": "Kimse gerçekten karmaşık donanım sistemlerinin nasıl kurulacağını bilmiyor, bu nedenle donanım tasarlamak daha basit olma eğilimindedir. Yazılım çok daha karmaşıktır."
    },
    {
      "id": "5aa4511b7832df00040ac9b8",
      "yazar": "Butler Lampson",
      "tr": "Güzel bir program güzel bir teorem gibidir: İşi zarif bir şekilde yapar."
    },
    {
      "id": "5aa456667832df00040ac9b9",
      "yazar": "John Warnock",
      "tr": "Başarılı olmak için, etrafınızı becerileri çok iyi harmanlanmış çok yetenekli insanlarla çevrelemek istiyorsunuz. Başarının sırrı bu."
    },
    {
      "id": "5aa459d77832df00040ac9bc",
      "yazar": "Gary Kildall",
      "tr": "Veri yapılarını çizmekle başlıyorum ve onlar hakkında düşünmek için çok zaman harcıyorum. Ayrıca kod yazmaya başlamadan önce programın neler yapması gerektiğini düşünüyorum."
    },
    {
      "id": "5aa456d87832df00040ac9ba",
      "yazar": "John Warnock",
      "tr": "Ortada hiçbir şey çıkmadan iki yıllık bir geliştirme sürecine girmeyin. İki ayda bir bir şeyler ortaya çıkarın, böylece değerlendirebilir, yeniden gruplandırabilir ve yeniden başlatabilirsiniz."
    },
    {
      "id": "5aa459767832df00040ac9bb",
      "yazar": "Gary Kildall",
      "tr": "Problemleri nasıl çözeceğinizi öğrenirseniz, hayatın içinden geçebilir ve oldukça başarılı olabilirsiniz."
    },
    {
      "id": "5aa45f317832df00040ac9c0",
      "yazar": "Bill Gates",
      "tr": "Harika bir programcı, ister araba sürerken ister yemek yerken, programı sürekli olarak düşünür. Bu yöntem inanılmaz miktarda zihinsel enerji alır."
    },
    {
      "id": "5aa4601c7832df00040ac9c1",
      "yazar": "Bill Gates",
      "tr": "Yazdığım gerçekten harika programların hepsi, onları yazmadan önce çok uzun zamandır düşündüğüm programlar oldu."
    },
    {
      "id": "5aa461667832df00040ac9c2",
      "yazar": "Bill Gates",
      "tr": "Karşılaştığınız zorluk türlerinde inanılmaz bir benzerlik var. Tasarım incelemelerinde, yaptığım programlara dayalı olarak tavsiyelerde bulunmaktan gerçekten keyif alıyorum."
    },
    {
      "id": "5a9b16b92bad9600044b6fe3",
      "yazar": "Fred Brooks",
      "tr": "Program bakımıyla ilgili temel sorun, bir kusuru düzeltmenin önemli bir (%20-50) başka bir kusur oluşturma şansının olmasıdır. Dolayısıyla tüm süreç iki adım ileri ve bir adım geridir."
    },
    {
      "id": "5aa5c874d1481c4acc43aa71",
      "yazar": "Addy Osmani",
      "tr": "Kullandığınız araçları gerçekten önemseyin çünkü sizi en iyi yapan şey onlar."
    },
    {
      "id": "5aa63f3a42fbc6000481ca0d",
      "yazar": "Michael Hawley",
      "tr": "Programlama hakkında sevdiğim şey, nasıl iletişim kurduğumuz, nasıl düşündüğümüz, mantığın nasıl çalıştığı, yaratıcı sanatların nasıl çalıştığı hakkında düşünmenize gerçekten yardımcı olması."
    },
    {
      "id": "5aa6de2101c2c400048eb9a8",
      "yazar": "Douglas Crockford",
      "tr": "Zorladığım şeylerden biri kod okuma. Bence bu, bir programcı topluluğunun birbirleri için yapabileceği en faydalı şey - düzenli olarak birbirlerinin kodunu okuyarak zaman geçirin."
    },
    {
      "id": "5aa6dd2101c2c400048eb9a7",
      "yazar": "Douglas Crockford",
      "tr": "JavaScript'i daha iyi hale getirmenin en iyi yolunun\nJavaScript'i küçültmek olduğunu düşünüyorum. Onu gerçekten iyi yaptığı şeye indirebilir ve çok az değer katan veya hiç değer katmayan özellikleri kaldırabilirsek, aslında daha iyi olur dilim."
    },
    {
      "id": "5aa6e0d101c2c400048eb9a9",
      "yazar": "Douglas Crockford",
      "tr": "Kodların okunabilirliği artık ilk önceliğim. Hızlı olmaktan daha önemli, neredeyse doğru olmak kadar önemli, ama bence okunabilir olmak aslında onu düzeltmenin en olası yolu."
    },
    {
      "id": "5aa6e37801c2c400048eb9aa",
      "yazar": "Douglas Crockford",
      "tr": "Programlamayı zorlaştıran şeyin bir kısmı, çoğu zaman daha önce hiç yapmadığımız şeyleri yapıyor olmamızdır."
    },
    {
      "id": "5aa6e8ac01c2c400048eb9ab",
      "yazar": "Douglas Crockford",
      "tr": "Kendimi bir yazar olarak görüyorum. Bazen İngilizce yazıyorum, bazen JavaScript yazıyorum."
    },
    {
      "id": "5aa63e0642fbc6000481ca0c",
      "yazar": "Jaron Lanier",
      "tr": "İnsanlar tıpkı şimdi konuştukları gibi konuşabilmeli ve programları soluyabilmeli."
    },
    {
      "id": "5aa9a89904c8cd0004d472c4",
      "yazar": "Joe Armstrong (programcı)",
      "tr": "Bir şeyleri kaldırmaya başlarsanız, daha fazlasını kaldırırsanız artık işe yaramayacağı bir noktaya gelirseniz - bu noktada güzeldir."
    },
    {
      "id": "5aa8307a94bd610da89b3340",
      "yazar": "Buckminster Fuller",
      "tr": "İnsanlık, tüm doğru teknolojiyi tüm yanlış nedenlerle elde ediyor."
    },
    {
      "id": "5aa9aa9f04c8cd0004d472c5",
      "yazar": "Simon Peyton Jones",
      "tr": "İşlevsel programlamayı, program yazma girişiminin tamamına radikal ve zarif bir saldırı olarak nitelendiriyorum."
    },
    {
      "id": "5aab9d9617c21b0004913edc",
      "yazar": "Marijn Haverbeke",
      "tr": "Boyut neredeyse her zaman karmaşıklık içerir ve karmaşıklık programcıların kafasını karıştırır. Kafası karışmış programcılar da programlara hatalar (hatalar) getirir."
    },
    {
      "id": "5aab9ade17c21b0004913edb",
      "yazar": "Marijn Haverbeke",
      "tr": "Bilgisayar programlarındaki kusurlara genellikle bug denir. Programcıları, onları, işimize giren küçük şeyler olarak hayal etmek kendilerini iyi hissettirir. Gerçekte, elbette, onları kendimiz koyarız."
    },
    {
      "id": "5aac2850c2138a00046e9183",
      "yazar": "L. Peter Deutsch",
      "tr": "Yeteneklerimin zirvesi olarak kabul edeceğim bir noktadayken, son derece güvenilir bir sezgiye sahiptim. Bir şeyler yapardım ve hemen ortaya çıkarlardı."
    },
    {
      "id": "5aac2af1c2138a00046e9185",
      "yazar": "L. Peter Deutsch",
      "tr": "Ara sıra bir programlama dili tasarlamak için bir istek duyuyorum ama sonra o kaybolana kadar uzanıyorum."
    },
    {
      "id": "5aac2cf9c2138a00046e9186",
      "yazar": "L. Peter Deutsch",
      "tr": "Dil sistemleri bir tripod üzerinde durur. Dil var, kütüphaneler var ve araçlar var. Ve bir dilin ne kadar başarılı olduğu bu üç şey arasındaki karmaşık etkileşime bağlıdır."
    },
    {
      "id": "5aac29e1c2138a00046e9184",
      "yazar": "L. Peter Deutsch",
      "tr": "Programlama dillerinin son 40 yılda niteliksel olarak gelişmediğini güçlü bir şekilde kanıtlayabilirim. Bugün kullanımda olan ve Simula-67'den niteliksel olarak daha iyi olan hiçbir programlama dili yok."
    },
    {
      "id": "5aac303cc2138a00046e9188",
      "yazar": "Gottfried Wilhelm Leibniz",
      "tr": "Onlar dizisi yerine, sayıların biliminin mükemmelleşmesi için yararlı olduğunu fark ettiğim için, ikişer ikişer ilerleyen en basit diziyi yıllarca kullandım."
    },
    {
      "id": "5aac2e8fc2138a00046e9187",
      "yazar": "L. Peter Deutsch",
      "tr": "En çılgın rüyalarımda bile İnternet'in evrimini tahmin edemezdim. Ve internet üzerindeki kurumsal etkinin zaman içinde karakterini ne derece değiştirdiğini asla tahmin edemezdim."
    },
    {
      "id": "5aac3a57610d7d0004066303",
      "yazar": "Ken Thompson",
      "tr": "Hiçbir zaman mevcut kodun sevgilisi olmadım. Kod kendi başına neredeyse çürür ve yeniden yazılması gerekir. Hiçbir şey değişmese bile, nedense çürür."
    },
    {
      "id": "5aac39b1610d7d0004066302",
      "yazar": "Ken Thompson",
      "tr": "Modern programlama beni birçok yönden korkutuyor. Yukarıdan aşağıya okumanız gereken bir programı okumak kafamı karıştırıyor. Bir şeyler yapın diyor. Ve sen bir şey bul. Ve onu okursunuz ve “başka bir şey yapın” der ve bir şey bulursunuz ve “başka bir şey yapın” der ve belki en başa döner ve hiçbir şey yapılmaz. Bu sadece sorunu daha derine havale ediyor ve daha derin bir seviye."
    },
    {
      "id": "5aa9a7b304c8cd0004d472c3",
      "yazar": "Richard Hamming",
      "tr": "Her zaman haftada bir günümü yeni şeyler öğrenerek geçiririm. Bu, zamanımın %20'sini meslektaşlarımdan yeni şeyler öğrenerek geçirdiğim anlamına gelir. Şimdi %20 bileşik faiz, dört buçuk yıl sonra öğreneceğim anlamına geliyor. onların iki katı."
    },
    {
      "id": "5aad68d17632ba0004ec84ae",
      "yazar": "Donald Knuth",
      "tr": "Kirli hileleri iki nedenden dolayı kullanacağım. Birincisi, eğer gerçekten performans artışı sağlayacaksa. Ya da bazen sadece zevk için. Her halükarda, bunu belgeliyorum; orada."
    },
    {
      "id": "5aac3aa3610d7d0004066304",
      "yazar": "Ken Thompson",
      "tr": "Bir şey eklemek istediğimde kodu atacağım ve bunu eklemek için yapmam gereken şeyin çok zor olduğu hissine kapılıyorum."
    },
    {
      "id": "5aad69767632ba0004ec84af",
      "yazar": "Donald Knuth",
      "tr": "Sorun şu ki, kitaplığı kendiniz yazamıyorsanız, yapabileceğiniz tek şey bir şeyleri kitaplıktan çağırmaksa kodlama eğlenceli değildir."
    },
    {
      "id": "5aad6d0d7632ba0004ec84b0",
      "yazar": "Donald Knuth",
      "tr": "Hata yapıyorum çünkü her zaman limitimde hareket ediyorum. Her zaman sadece rahat bir bölgede kalırsam, bu pek eğlenceli olmaz."
    },
    {
      "id": "5aad6dfa7632ba0004ec84b1",
      "yazar": "Donald Knuth",
      "tr": "Bu programlamaya ihtiyacım var. Sabahları okuryazar bir programın cümleleri ile uyanıyorum. Kahvaltıdan önce - eminim şairler bunu hissediyordur - bilgisayara gidip bu paragrafı yazmam gerekiyor. ve sonra yiyebilirim ve mutluyum."
    },
    {
      "id": "5aad71337632ba0004ec84b2",
      "yazar": "Donald Knuth",
      "tr": "Farklı türde notasyonların daha fazla çeşidi hala faydalıdır - yalnızca sizin gibi kod yazan kişileri okumayın."
    },
    {
      "id": "5ab6e0d632a9950004a2efc2",
      "yazar": "Ted Nelson",
      "tr": "Bilgisayarlarla ilgili iyi haber, yapmalarını söylediğiniz şeyi yapmalarıdır. Kötü haber ise, yapmalarını söylediğinizi yapmalarıdır."
    },
    {
      "id": "5aa6e99001c2c400048eb9ac",
      "yazar": "Douglas Crockford",
      "tr": "Matematik programlamada önemlidir, ancak önemli olan pek çok şeyden sadece biridir. Matematiği fazla vurgularsanız, okuryazarlık gibi daha da önemli olabilecek şeyleri eksik vurgularsınız."
    },
    {
      "id": "5aac3b37610d7d0004066305",
      "yazar": "Ken Thompson",
      "tr": "Belgeleme çok, çok zor; zaman alıcı. Doğru yapmak için programlama gibi yapmalısınız. Yapısını bozmanız, güzel bir şekilde bir araya getirmeniz, gerektiğinde yeniden yazmanız gerekir. bu yanlış. İnsanlar bunu yapmaz."
    },
    {
      "id": "5ab6e20132a9950004a2efc6",
      "yazar": "Ted Nelson",
      "tr": "İşleri kolaylaştırmak zordur."
    },
    {
      "id": "5ab6e9e132a9950004a2efc7",
      "yazar": "Richard Moore (mühendis)",
      "tr": "Teori ile pratik arasındaki fark, teoride teori ile pratik arasında hiçbir fark olmamasıdır."
    },
    {
      "id": "5ab6ea2a32a9950004a2efc8",
      "yazar": "Jim Coplien",
      "tr": "Bir değişkeni, ilk doğan bir çocuğa ad verirken aynı özenle adlandırmalısınız."
    },
    {
      "id": "5acca81fe01bb40004668819",
      "yazar": "Robert C. Martin",
      "tr": "Okumaya harcanan zamanın yazmaya karşı oranı 10'a 1'in oldukça üzerindedir. Yeni kod yazma çabasının bir parçası olarak sürekli olarak eski kodu okuyoruz."
    },
    {
      "id": "5b579bb420e9780004ba9ac3",
      "yazar": "Kyle Simpson",
      "tr": "Geçici bir saldırıdan daha kalıcı bir şey yoktur."
    },
    {
      "id": "5b6d73d6b3f09f0004d9275f",
      "yazar": "Gottfried Wilhelm Leibniz",
      "tr": "Sayılar 0 ve 1 gibi en basit ilkelere indirgendiğinden, baştan sona harika bir düzen ortaya çıkıyor."
    },
    {
      "id": "5ab6e1ad32a9950004a2efc4",
      "yazar": "Ted Nelson",
      "tr": "Lisansüstü okuldaki ikinci yılımda bilgisayar dersi aldım ve bu şimşek çakması gibiydi."
    },
    {
      "id": "5ab6e13932a9950004a2efc3",
      "yazar": "Ted Nelson",
      "tr": "Bilgisayarların sayılarla ilgilendiğini söylüyorlardı. Bu kesinlikle saçmalıktı. Bilgisayarlar her türden keyfi bilgiyle uğraşır."
    },
    {
      "id": "5ab6e1dd32a9950004a2efc5",
      "yazar": "Ted Nelson",
      "tr": "Şu anda kullandığınız her uygulamanın tutsağısınız. Yalnızca o uygulamanın geliştiricisi tarafından size verilen seçeneklere sahipsiniz."
    },
    {
      "id": "5a6ce86f2af929789500e83d",
      "yazar": "Ray Ozzie",
      "tr": "Karmaşıklık öldürür. Geliştiricilerin hayatını emer, ürünlerin planlanmasını, oluşturulmasını ve test edilmesini zorlaştırır, güvenlik sorunlarına yol açar ve son kullanıcı ile yöneticinin hayal kırıklığına uğramasına neden olur."
    },
    {
      "id": "5a6ce8702af929789500e882",
      "yazar": "Niklaus Wirth",
      "tr": "Yazılım, donanımın hızlanmasından daha hızlı yavaşlar."
    },
    {
      "id": "5a6ce8702af929789500e89e",
      "yazar": "David Parnas",
      "tr": "Bilgisayar, inanılmaz derecede akıllı şeyler yapma yeteneğine sahip aptal bir makinedir, bilgisayar programcıları ise inanılmaz derecede aptalca şeyler yapma yeteneğine sahip akıllı insanlardır. Kısacası, mükemmel bir eşleşmedir."
    },
    {
      "id": "5a6ce8702af929789500e8c4",
      "yazar": "Anonim",
      "tr": "Kod yazmak birkaç ay içinde size tasarımda birkaç saat kazandırabilir."
    },
    {
      "id": "5a72f8251ac5f022282e4125",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Güçlü programlama dillerinizin tüm bu harika özelliklerinin, tüm bu zil ve ıslıkların, problem kümesinden ziyade çözüm kümesine ait olduğundan emin misiniz?"
    },
    {
      "id": "5a91e3a1c4240c0004265956",
      "yazar": "John von Neumann",
      "tr": "İnsanlar matematiğin basit olduğuna inanmıyorlarsa, bunun nedeni hayatın ne kadar karmaşık olduğunun farkında olmamalarıdır."
    },
    {
      "id": "5a933a408e7b510004cba4bb",
      "yazar": "Bjarne Stroustrup",
      "tr": "C kendini ayağından vurmanı kolaylaştırır; C++ bunu daha da zorlaştırır, ama yaptığında tüm bacağını uçurur."
    },
    {
      "id": "5a933a668e7b510004cba4bc",
      "yazar": "Bjarne Stroustrup",
      "tr": "Basit olduğunu düşünüyorsanız, sorunu yanlış anladınız."
    },
    {
      "id": "5a9342458e7b510004cba4c7",
      "yazar": "Rob Pike",
      "tr": "Nesne yönelimli tasarım, hesaplamanın roma rakamlarıdır."
    },
    {
      "id": "5a93d61c6a584e0004a4a613",
      "yazar": "Steve Jobs",
      "tr": "4300'den fazla çalışanı olan 2 milyar dolarlık bir şirketin mavi kot pantolon giyen altı kişiyle rekabet edemeyeceğini düşünmek zor."
    },
    {
      "id": "5a93ffbae49ad10004edb861",
      "yazar": "Jamie Zawinski",
      "tr": "Bazı insanlar bir sorunla karşılaştıklarında 'Biliyorum, normal ifadeler kullanacağım' diye düşünürler. Şu an iki problemleri var."
    },
    {
      "id": "5a943255ee7ed5000496b17c",
      "yazar": "Bill Gates",
      "tr": "Bazen gafil avlanırız. Örneğin, İnternet çıktığında beşinci veya altıncı önceliğimiz vardı."
    },
    {
      "id": "5a9432f0ee7ed5000496b180",
      "yazar": "Ward Cunningham",
      "tr": "Her tartışmayı kazanmak zorunda olmadığımı fark ettiğimde programlama kariyerimde bir dönüm noktası oldu."
    },
    {
      "id": "5a9435b6ee7ed5000496b18f",
      "yazar": "Vint Cerf",
      "tr": "Ve bilgisayarları programlamak çok etkileyiciydi. Kendi küçük evreninizi yaratırsınız ve sonra ona yapmasını söylediğiniz şeyi yapar."
    },
    {
      "id": "5a943552ee7ed5000496b18d",
      "yazar": "Joshua Bloch",
      "tr": "Program ne kadar temiz ve güzel olursa, o kadar hızlı çalışır. Çalışmazsa, hızlı hale getirmek kolay olacaktır."
    },
    {
      "id": "5a9436dcee7ed5000496b194",
      "yazar": "Philip Greenspun",
      "tr": "SQL, Lisp ve Haskell, insanın yazmaya yazmaktan daha fazla zaman harcadığını gördüğüm tek programlama dilleri."
    },
    {
      "id": "5a95a610cb1a4d0004b2987e",
      "yazar": "Alan Perlis",
      "tr": "Bir veri yapısında 100 işlevin çalışması, 10 işlevin 10 veri yapısında çalışması yerine daha iyidir."
    },
    {
      "id": "5a95d1077700780004d51db9",
      "yazar": "Brian Kernighan",
      "tr": "En etkili hata ayıklama aracı, yine de dikkatli düşünmek ve mantıklı bir şekilde yerleştirilmiş baskı ifadeleriyle birlikte kullanmaktır."
    },
    {
      "id": "5a95d7637700780004d51dc5",
      "yazar": "Marvin Minsky",
      "tr": "Geleceğin bilgisayar dilleri, programcı tarafından belirlenen prosedürlerle daha az hedeflerle daha çok ilgilenecek."
    },
    {
      "id": "5a95fe167700780004d51dcd",
      "yazar": "Alan Turing",
      "tr": "Bir insanı kandırıp insan olduğuna inandırabilen bir bilgisayar zeki olarak adlandırılmayı hak ederdi."
    },
    {
      "id": "5a96be3ed6959500047aecbd",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "Yazılımdaki entropiyi durdurmanın yolu onu yeniden düzenlemektir."
    },
    {
      "id": "5a96bf21d6959500047aecc0",
      "yazar": "Joseph Yoder (bilgisayar bilimcisi)",
      "tr": "İncelemeler ve eşli programlama, programcılara çalışmalarının aksi halde sahip olamayacağı bir şey sağlar: bir izleyici. Güneş ışığının güçlü bir dezenfektan olduğu söylenir. Bir kişinin akranlarından oluşan bir kitle, programcılara kodlarını açık ve net tutmaları için anında teşvikler sağlar. hem anlaşılır hem de işlevsel."
    },
    {
      "id": "5a97f2c0ccdfe50004febf38",
      "yazar": "John Romero",
      "tr": "Programcıların sanatçı olduklarını düşünmeyebilirsiniz, ancak programlama son derece yaratıcı bir meslektir. Mantık temelli yaratıcılıktır."
    },
    {
      "id": "5a97f4c5ccdfe50004febf3c",
      "yazar": "Douglas Crockford",
      "tr": "JavaScript, insanların kullanmaya başlamadan önce öğrenmeleri gerekmediğini düşündüklerini bildiğim tek dil."
    },
    {
      "id": "5a9808951878b40004879f61",
      "yazar": "Addy Osmani",
      "tr": "Alçakgönüllü olun, net bir şekilde iletişim kurun ve başkalarına saygı gösterin. Nazik olmanın hiçbir maliyeti yoktur, ancak etkisi paha biçilemez."
    },
    {
      "id": "5a9808dc1878b40004879f63",
      "yazar": "Pete Cordell",
      "tr": "Bir programcıya X yapmak için zaten bir kitaplık olduğunu söylemek, bir şarkı yazarına zaten aşk hakkında bir şarkı olduğunu söylemek gibidir."
    },
    {
      "id": "5a980f551878b40004879f68",
      "yazar": "Stan Kelly-Bootle",
      "tr": "Dizi indeksleri 0'dan mı yoksa 1'den mi başlamalı? 0,5'lik uzlaşmam, uygun bir değerlendirme yapılmadan reddedildi."
    },
    {
      "id": "5a985fd2e93441000489b94d",
      "yazar": "Edsger W. Dijkstra",
      "tr": "Soyutlamanın amacı belirsiz olmak değil, kesinlikle kesin olunabilecek yeni bir anlamsal düzey yaratmaktır."
    },
    {
      "id": "5a9a9e792bad9600044b6fb5",
      "yazar": "Elon Musk",
      "tr": "Kesinlikle iş kesintisi olacak. Çünkü olacak olan, robotlar her şeyi bizden daha iyi yapabilecek."
    },
    {
      "id": "5a9860dbe93441000489b950",
      "yazar": "John Carmack",
      "tr": "Bazen zarif uygulama bir işlevdir. Yöntem değil. Sınıf değil. Çerçeve değil. Yalnızca işlev."
    },
    {
      "id": "5a9aa0f72bad9600044b6fb8",
      "yazar": "Marvin Minsky",
      "tr": "Yapay zeka, insanlar tarafından yapıldığında zeka gerektiren şeyleri makinelere yaptırma bilimidir."
    },
    {
      "id": "5a9aaf682bad9600044b6fbb",
      "yazar": "Tim Berners-Lee",
      "tr": "Sadece köprü metni fikrini almam ve onu TCP ve DNS fikirlerine ve — ta-da!— World Wide Web'e bağlamam gerekiyordu."
    },
    {
      "id": "5a9b0d552bad9600044b6fd4",
      "yazar": "Hal Abelson",
      "tr": "Hesaplama süreci gerçekten de bir büyücünün ruh fikrine çok benzer. Görünmez veya dokunulmaz. Hiç maddeden oluşmaz. Ancak çok gerçektir. Zihinsel çalışma yapabilir. Soruları yanıtlayın. Bir bankada para vererek veya bir fabrikada bir robot kolunu kontrol ederek dünyayı etkileyebilir."
    },
    {
      "id": "5a9b17792bad9600044b6fe5",
      "yazar": "Fred Brooks",
      "tr": "Birçok hata olacağını varsaymak ve onları dışarı atmak için düzenli bir prosedür planlamak gerekir."
    },
    {
      "id": "5a9b19662bad9600044b6ff1",
      "yazar": "Fred Brooks",
      "tr": "Kavramsal bütünlüğü sağlamak için, bir tasarım tek bir akıldan veya küçük bir fikir birliği grubundan yola çıkmalıdır."
    },
    {
      "id": "5a9b1d152bad9600044b6ff9",
      "yazar": "Tom DeMarco",
      "tr": "En iyi teknolojinin asla kız arkadaş ya da erkek arkadaş sorunu kadar etkisi yoktur."
    },
    {
      "id": "5a9b19952bad9600044b6ff3",
      "yazar": "Fred Brooks",
      "tr": "Bakım maliyeti, kullanıcı sayısından büyük ölçüde etkilenir. Daha fazla kullanıcı daha fazla hata bulur."
    },
    {
      "id": "5a9b1f8c2bad9600044b7003",
      "yazar": "Daniel T. Barry",
      "tr": "Hataların çoğu gereksinim belirtimi sırasında ortaya çıkıyor!"
    },
    {
      "id": "5a9b21892bad9600044b7006",
      "yazar": "Harlan Mills",
      "tr": "Programlama golf oyununa benzer. Önemli olan topu deliğe sokmak değil, kaç vuruş yapması gerektiğidir."
    },
    {
      "id": "5a9b22b42bad9600044b700a",
      "yazar": "Daniel T. Barry",
      "tr": "Bir dizi çalışma, testlerin hata bulmada çok etkili olmadığını göstermiştir."
    },
    {
      "id": "5a9b23cd2bad9600044b7010",
      "yazar": "Daniel T. Barry",
      "tr": "Yazılım maliyetlerini düşük tutmanın anahtarı, kolayca değiştirilebilen kodlar yazmaktır."
    },
    {
      "id": "5a9b24492bad9600044b7014",
      "yazar": "Daniel T. Barry",
      "tr": "Matematikte ve programlarda doğruluk kavramları farklıdır. Bir matematiksel model tutarlı olmalıdır; gerçekle eşleşmesi (doğru olması) ve tam olması (biçimsel anlamda) olması gerekmez. Bir program modeli tutarlı olmalı, gerçeklikle eşleşmeli ve eksiksiz olmalıdır (tüm girdilere zarif bir şekilde tepki vermesi anlamında)."
    },
    {
      "id": "5a9b23ed2bad9600044b7012",
      "yazar": "Daniel T. Barry",
      "tr": "Programlama en az matematiksel bir teori geliştirmek kadar zordur."
    },
    {
      "id": "5a9d2fc8607c5100044dff78",
      "yazar": "Richard Stallman",
      "tr": "1971'de MIT Yapay Zeka laboratuvarının kadrosuna katıldığımda, işletim sistemi yazılımının geliştirilmesine yardımcı olan hepimiz kendimize hacker diyorduk. Herhangi bir yasayı çiğnmiyorduk, en azından yaptığımız hacklemeyi yapmıyorduk. yapmak için para ödeniyordu. Yazılım geliştiriyorduk ve eğleniyorduk. Hacking, yazılım geliştirdiğimiz eğlence ruhunu ifade ediyor."
    },
    {
      "id": "5a9dc6316744730004f6a1e7",
      "yazar": "Maurice Wilkes",
      "tr": "Haziran 1949'a gelindiğinde insanlar, programları doğru bir şekilde almanın bir zamanlar göründüğü kadar kolay olmadığını anlamaya başladılar."
    },
    {
      "id": "5aa28dd71dcf530004c4bf66",
      "yazar": "Butler Lampson",
      "tr": "Her şey mümkün olduğu kadar basit hale getirilmelidir. Ancak bunu yapmak için karmaşıklıkta ustalaşmanız gerekir."
    },
    {
      "id": "5aa29df5e7e86700048f027d",
      "yazar": "Wayne Ratliff",
      "tr": "Tavsiye yerine kalbimi dinleseydim, dBASE bugün mükemmele çok daha yakın olurdu."
    },
    {
      "id": "5aa29e43e7e86700048f027e",
      "yazar": "Wayne Ratliff",
      "tr": "Programlama biraz orduya benziyor. Artık çıktığıma göre, deneyime sahip olmak güzel."
    },
    {
      "id": "5aa2a20ce7e86700048f0282",
      "yazar": "Jonathan Sachs",
      "tr": "Kendi yazmadığım veya üzerinde biraz kontrolüm olmayan araçları veya programları kullanmaktan hoşlanmıyorum."
    },
    {
      "id": "5aa2a15fe7e86700048f0281",
      "yazar": "Bob Frankston",
      "tr": "Eğer bir programı kendinize açıklayamıyorsanız, bilgisayarın onu \ndoğru bulma şansı oldukça azdır."
    },
    {
      "id": "5aa45ab57832df00040ac9bd",
      "yazar": "Gary Kildall",
      "tr": "Kodun kendisi hakkında yorum yapmıyorum çünkü düzgün yazılmış kodun çok fazla kendi kendini belgelediğini düşünüyorum."
    },
    {
      "id": "5aa45bcf7832df00040ac9be",
      "yazar": "Gary Kildall",
      "tr": "Bir program temiz ve derli toplu, güzel yapılandırılmış ve tutarlı olduğunda güzel olabilir."
    },
    {
      "id": "5aa6db5d01c2c400048eb9a6",
      "yazar": "Douglas Crockford",
      "tr": "JavaScript, tamamen tesadüfen dünyadaki en popüler programlama dili haline geldi."
    },
    {
      "kimlik": "5aac2669c2138a00046e9182",
      "yazar": "L. Peter Deutsch",
      "tr": "Yazılım bir ayrıntı disiplinidir ve bu, yazılımla ilgili derin, korkunç bir temel sorundur."
    },
    {
      "id": "5aac309cc2138a00046e9189",
      "yazar": "Gottfried Wilhelm Leibniz",
      "tr": "Çocuk oyunlarında bile en büyük matematikçinin ilgisini çekecek şeyler vardır."
    }
  ];