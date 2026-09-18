const CACHE = 'happy-little-kitchen-v12';

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css?v=12',
  'js/app.js?v=12',
  'assets/kitchen.jpg',
  'assets/friends/butterfly.png',
  'assets/friends/cat.png',
  'assets/friends/dolphin.png',
  'assets/friends/fox.png',
  'assets/friends/octopus.png',
  'assets/friends/penguin.png',
  'assets/friends/rabbit-full.png',
  'assets/friends/rabbit-love.png',
  'assets/friends/rabbit-sneeze.png',
  'assets/friends/rabbit-yum.png',
  'assets/friends/rabbit.png',
  'assets/friends/seal-full.png',
  'assets/friends/seal-love.png',
  'assets/friends/seal-sneeze.png',
  'assets/friends/seal-yum.png',
  'assets/friends/seal.png',
  'assets/friends/squirrel.png',
  'assets/friends/turtle-full.png',
  'assets/friends/turtle-love.png',
  'assets/friends/turtle-sneeze.png',
  'assets/friends/turtle-yum.png',
  'assets/friends/turtle.png',
  'assets/friends/unicorn.png',
  'assets/dishes/cake.png',
  'assets/dishes/cookie.png',
  'assets/dishes/cupcake.png',
  'assets/dishes/icecream.png',
  'assets/dishes/noodles.png',
  'assets/dishes/omelet.png',
  'assets/dishes/pizza.png',
  'assets/dishes/smoothie.png',
  'assets/dishes/toast.png',
  'assets/appliances/blender.png',
  'assets/appliances/freezer.png',
  'assets/appliances/oven.png',
  'assets/appliances/pan.png',
  'assets/appliances/pot.png',
  'assets/appliances/toaster.png',
  'assets/ingredients/banana-cut.png',
  'assets/ingredients/banana.png',
  'assets/ingredients/bokchoy-cut.png',
  'assets/ingredients/bokchoy.png',
  'assets/ingredients/bread-cut.png',
  'assets/ingredients/bread.png',
  'assets/ingredients/butter-cut.png',
  'assets/ingredients/butter.png',
  'assets/ingredients/cheese.png',
  'assets/ingredients/chocchips.png',
  'assets/ingredients/dough.png',
  'assets/ingredients/egg-cracked.png',
  'assets/ingredients/egg.png',
  'assets/ingredients/fishball.png',
  'assets/ingredients/flour.png',
  'assets/ingredients/honey.png',
  'assets/ingredients/milk.png',
  'assets/ingredients/noodles.png',
  'assets/ingredients/springonion-cut.png',
  'assets/ingredients/springonion.png',
  'assets/ingredients/strawberry-cut.png',
  'assets/ingredients/strawberry.png',
  'assets/ingredients/sugar.png',
  'assets/ingredients/tomato-cut.png',
  'assets/ingredients/tomato.png',
  'assets/tools/board.png',
  'assets/tools/knife.png',
  'assets/tools/ladle.png',
  'assets/tools/rollingpin.png',
  'assets/tools/spoon.png',
  'assets/tools/whisk.png',
  'assets/toppings/banana.png',
  'assets/toppings/blueberry.png',
  'assets/toppings/candle.png',
  'assets/toppings/carrot.png',
  'assets/toppings/cherry.png',
  'assets/toppings/chili.png',
  'assets/toppings/chocchip.png',
  'assets/toppings/chocsauce.png',
  'assets/toppings/coriander.png',
  'assets/toppings/corn.png',
  'assets/toppings/cream.png',
  'assets/toppings/cucumber.png',
  'assets/toppings/egg.png',
  'assets/toppings/heart.png',
  'assets/toppings/honeydrizzle.png',
  'assets/toppings/ketchup.png',
  'assets/toppings/kiwi.png',
  'assets/toppings/lime.png',
  'assets/toppings/marshmallow.png',
  'assets/toppings/mint.png',
  'assets/toppings/mushroom.png',
  'assets/toppings/olive.png',
  'assets/toppings/orange.png',
  'assets/toppings/peas.png',
  'assets/toppings/pepper.png',
  'assets/toppings/pineapple.png',
  'assets/toppings/rainbow.png',
  'assets/toppings/seaweed.png',
  'assets/toppings/sesame.png',
  'assets/toppings/shrimp.png',
  'assets/toppings/springonion.png',
  'assets/toppings/sprinkles.png',
  'assets/toppings/star.png',
  'assets/toppings/starcookie.png',
  'assets/toppings/strawberry.png',
  'assets/toppings/tomatoslice.png',
  'assets/toppings/wafer.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (
        key.startsWith('happy-little-kitchen-') || key.startsWith('lilly-playhouse-')
      ) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put('index.html', copy)).catch(() => {});
        return response;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match('index.html')))
  );
});
