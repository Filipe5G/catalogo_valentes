// Configuração do número da distribuidora (Código do país + DDD + Número)
const WHATSAPP_NUMBER = "5511912299261"; 

// Lista de Produtos Cadastrados
const products = [
    {
        id: 1,
        title: "Torrone Artesanal de Amêndoas",
        category: "doces",
        price: 18.90,
        flavors: ["Tradicional", "Com Chocolate", "Cranberry"],
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500"
    },
    {
        id: 2,
        title: "Café Gourmet",
        category: "bebidas",
        price: 24.00,
        flavors: ["Preto", "Leite Desnatado", "Intenso", "Suave"],
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
    },
    {
        id: 3,
        title: "Chocolate Fino 70% Cacau",
        category: "doces",
        price: 14.90,
        flavors: ["Puro", "Com Laranja", "Menta"],
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500"
    }
];

// Estado da Aplicação - Recupera do localStorage se existir, senão inicia vazio
let cart = JSON.parse(localStorage.getItem('valentes_cart')) || [];
let currentProduct = null;

// Mapeamento de Elementos do DOM
const productsGrid = document.getElementById('products-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const productModal = document.getElementById('product-modal');
const cartSidebar = document.getElementById('cart-sidebar');

// --- 1. RENDERIZAR PRODUTOS NA VITRINE ---
function displayProducts(productsList) {
    productsGrid.innerHTML = productsList.map(product => `
        <article class="product-card" onclick="openModal(${product.id})">
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
            </div>
        </article>
    `).join('');
}

// --- 2. CONTROLE DE FILTROS ---
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const category = e.currentTarget.dataset.category;
        
        if (category === 'all') {
            displayProducts(products);
        } else {
            displayProducts(products.filter(p => p.category === category));
        }
    });
});

// --- 3. MODAL DE DETALHES DO PRODUTO ---
function openModal(id) {
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    document.getElementById('modal-img').src = currentProduct.image;
    document.getElementById('modal-title').innerText = currentProduct.title;
    document.getElementById('modal-price').innerText = `R$ ${currentProduct.price.toFixed(2).replace('.', ',')}`;

    // Renderiza cada sabor com seu controle individual de quantidade
    const flavorsContainer = document.getElementById('modal-flavors');
    flavorsContainer.innerHTML = currentProduct.flavors.map((flavor, index) => `
        <div class="flavor-quantity-row">
            <span class="flavor-name">${flavor}</span>
            <div class="quantity-controls small">
                <button type="button" onclick="changeFlavorQty(${index}, -1)">-</button>
                <input type="number" id="flavor-qty-${index}" class="flavor-input-qty" value="0" min="0" data-flavor="${flavor}" readonly>
                <button type="button" onclick="changeFlavorQty(${index}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const legacyQtyContainer = document.querySelector('.quantity-container');
    if (legacyQtyContainer) legacyQtyContainer.style.display = 'none';

    productModal.style.display = 'flex';
}

function changeFlavorQty(index, change) {
    const input = document.getElementById(`flavor-qty-${index}`);
    let newVal = parseInt(input.value) + change;
    if (newVal < 0) newVal = 0;
    input.value = newVal;
}

document.getElementById('close-modal').addEventListener('click', () => productModal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === productModal) productModal.style.display = 'none'; });

// --- 4. GERENCIAMENTO DO CARRINHO ---

document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    const flavorInputs = document.querySelectorAll('.flavor-input-qty');
    let selectedFlavors = [];
    let totalProductQuantity = 0;

    flavorInputs.forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            selectedFlavors.push({
                name: input.dataset.flavor,
                qty: qty
            });
            totalProductQuantity += qty;
        }
    });

    if (selectedFlavors.length === 0) {
        alert("Por favor, selecione a quantidade de pelo menos um sabor!");
        return;
    }

    const existingProductIndex = cart.findIndex(item => item.id === currentProduct.id);

    if (existingProductIndex > -1) {
        selectedFlavors.forEach(newFlavor => {
            const existingFlavor = cart[existingProductIndex].flavors.find(f => f.name === newFlavor.name);
            if (existingFlavor) {
                existingFlavor.qty += newFlavor.qty;
            } else {
                cart[existingProductIndex].flavors.push(newFlavor);
            }
        });
        cart[existingProductIndex].quantity += totalProductQuantity;
    } else {
        cart.push({
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            quantity: totalProductQuantity,
            flavors: selectedFlavors
        });
    }

    updateCart();
    productModal.style.display = 'none';
    openCart();
});

// Atualiza a Interface, calcula totais e sincroniza o localStorage
function updateCart() {
    // Salva o estado atualizado do carrinho no navegador
    localStorage.setItem('valentes_cart', JSON.stringify(cart));

    // Exibe a quantidade de PRODUTOS ÚNICOS no carrinho
    document.getElementById('cart-count').innerText = cart.length;

    const cartItemsContainer = document.getElementById('cart-items');
    let total = 0;

    cartItemsContainer.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const flavorsText = item.flavors.map(f => `${f.qty}x ${f.name}`).join(', ');

        return `
            <div class="cart-item">
                <h4>${item.title}</h4>
                <div class="cart-item-details">
                    <strong>Sabores:</strong> ${flavorsText} <br>
                    <strong>Qtd Total:</strong> ${item.quantity} un.
                </div>
                <strong>R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong>
                <span class="remove-item" onclick="removeFromCart(${index})">Remover</span>
            </div>
        `;
    }).join('');

    document.getElementById('cart-total-value').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

const openCart = () => cartSidebar.classList.add('open');
const closeCart = () => cartSidebar.classList.remove('open');

document.getElementById('cart-toggle-btn').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);

// --- 5. FECHAMENTO DE PEDIDO VIA WHATSAPP ---
// --- 5. FECHAMENTO DE PEDIDO VIA WHATSAPP (NOVO LAYOUT) ---
document.getElementById('checkout-whatsapp').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "📋 *NOVO PEDIDO - DISTRIBUIDORA VALENTES*\n";
    message += "======================================\n\n";
    message += "Olá! Segue a lista dos itens selecionados:\n\n";

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Cabeçalho do produto em destaque
        message += `*📦 ${item.title}*\n`;
        
        // Listagem direta: mais limpa e sem redundâncias
        item.flavors.forEach(f => {
            message += `    ${f.qty}x un. — ${f.name}\n`;
        });
        
        // Resumo do bloco compactado
        message += `  *Qtd Total:* ${item.quantity} un. | *Subtotal:* R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
        message += "--------------------------------------\n";
    });

    // Bloco final de fechamento ajustado com a vírgula correta
    message += `\n💰 *VALOR TOTAL DO PEDIDO: R$ ${total.toFixed(2).replace('.', ',')}*\n`;
    message += "======================================\n\n";
    message += "Aguardando confirmação dos dados para faturamento. Obrigado!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
});

// Inicialização da Página - Renderiza produtos e força leitura do carrinho salvo
window.addEventListener('DOMContentLoaded', () => {
    displayProducts(products);
    updateCart(); // Garante que o carrinho renderize o que estava no localStorage
});