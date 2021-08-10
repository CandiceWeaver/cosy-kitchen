'use strict';

// Contentful API
const client = contentful.createClient({
  space: '214yv3v9z8xg',
  accessToken: 'hNJyAhabLPrFIbD0IKJeY3FqX_82CdkQLr33LRHJGqA',
});

// Variables
const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartContainer = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsContent = document.querySelector('.products-center');

// Cart
let cart = [];

// Buttons
let buttonsArray = [];

// UI so products can be added to cart
let ui;

// Get products
class Products {
  async getProducts() {
    try {
      const contentfulResponse = await client.getEntries({
        content_type: 'cosy-kitchen-products',
      });

      let result = await fetch('products.json');
      let data = await result.json();
      let products = contentfulResponse.items;

      products = products.map(item => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// Display products
class UI {
  displayProducts(products) {
    let result = '';

    products.forEach(product => {
      result += `
      <article class="product">
          <div class="img-container">
              <img src=${product.image} alt="product" class="product-img">
              <button class="bag-btn" data-id=${product.id}>
                  <ion-icon name="cart-sharp" class="cart-icon"></ion-icon>
                  add to bag
              </button>
          </div>
          <h3>${product.title}</h3>
          <h4>£${product.price}</h4>
      </article>
  `;
    });

    productsContent.innerHTML = result;
  }

  getBagButtons() {
    // Won't work if you define this variable with the rest
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsArray = buttons;

    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => {
        item.id === id;
      });

      if (inCart) {
        button.innerText = 'In Cart';
        button.disabled = true;
      }

      button.addEventListener('click', event => {
        event.target.innerText = 'In Cart';
        event.target.disabled = true;

        // Setup application
        ui.setupApp();

        // Get product from products based on ID
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        // Add product to cart
        cart = [...cart, cartItem];

        // Save cart in local storage
        Storage.saveCart(cart);

        // Set cart values
        this.setCartValues(cart);

        // Display item in cart
        this.addCartItem(cartItem);

        // Show cart
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
    <img src=${item.image} alt="product">
    <div>
        <h4>${item.title}</h4>
        <h5>£${item.price}</h5>
        <span class="remove-item" data-id=${item.id}>remove</span>
    </div>
    <div>
        <ion-icon name="chevron-up-sharp" class="chevron-up-icon" data-id=${item.id}></ion-icon>
        <p class="item-amount">${item.amount}</p>
        <ion-icon name="chevron-down-sharp" class="chevron-down-icon" data-id=${item.id}></ion-icon>
    </div>`;

    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartContainer.classList.add('showCart');
  }

  setupApp() {
    cart = Storage.getCart();

    this.setCartValues(cart);
    this.populateCart(cart);

    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartContainer.classList.remove('showCart');
  }

  cartLogic() {
    clearCartBtn.addEventListener('click', () => {
      this.clearCart();
    });

    // Cart functionality
    cartContent.addEventListener('click', event => {
      if (event.target.classList.contains('remove-item')) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;

        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains('chevron-up-icon')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);

        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains('chevron-down-icon')) {
        let subtractAmount = event.target;
        let id = subtractAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);

        tempItem.amount = tempItem.amount - 1;

        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          subtractAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(subtractAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }

  clearCart() {
    let cartItems = cart.map(item => item.id);

    cartItems.forEach(id => this.removeItem(id));

    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);

    this.setCartValues(cart);
    Storage.saveCart(cart);

    let button = this.getSingleButton(id);

    button.disabled = false;
    button.innerHTML = `<ion-icon name="cart-sharp" class="cart-sharp"></ion-icon>
    add to bag`;
  }

  getSingleButton(id) {
    return buttonsArray.find(button => button.dataset.id === id);
  }
}

// Local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));

    return products.find(product => product.id === id);
  }

  static saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }
}

// Event listener
document.addEventListener('DOMContentLoaded', () => {
  ui = new UI();
  const products = new Products();

  ui.setupApp();

  // Get all products
  products
    .getProducts()
    .then(products => {
      ui.displayProducts(products);

      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
