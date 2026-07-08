// Configuração do número da distribuidora (Código do país + DDD + Número)
const WHATSAPP_NUMBER = "5511912299261"; 

// Lista de Produtos Cadastrados
const products = [
    {
        id: 1,
        title: "Salgadinho Bacon com Ketchup",
        description: "Descrição",
        category: "salgadinho",
        price: 18.90,
        flavors: ["Bacon"],
        image: "./assets/kigesto-bacon-com-ketchup.png"
    },
    {
        id: 2,
        title: "Salgadinho Premium",
        description: "",
        category: "salgadinho",
        price: 24.00,
        flavors: ["Preto", "Leite Desnatado", "Intenso", "Suave"],
        image: "./assets/salgadinho_kigosto_premium.png"
    },
    {
        id: 3,
        title: "Bisconobre",
        description: "",
        category: "doces",
        price: 14.90,
        flavors: ["Puro", "Com Laranja", "Menta"],
        image: "./assets/bisconobre.jpg"
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
    productsGrid.innerHTML = productsList.map(product => {
        const priceFormatted = product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
            <article class="product-card" onclick="openModal(${product.id})">
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">R$ ${priceFormatted}</div>
                </div>
            </article>
        `;
    }).join('');
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

    const modalPriceFormatted = currentProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('modal-img').src = currentProduct.image;
    document.getElementById('modal-title').innerText = currentProduct.title;
    document.getElementById('modal-description').innerText = currentProduct.description;
    document.getElementById('modal-price').innerText = `R$ ${modalPriceFormatted}`;

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
        const itemTotalFormatted = itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return `
            <div class="cart-item">
                <h4>${item.title}</h4>
                <div class="cart-item-details">
                    <strong>Sabores:</strong> ${flavorsText} <br>
                    <strong>Qtd Total:</strong> ${item.quantity} un.
                </div>
                <strong>R$ ${itemTotalFormatted}</strong>
                <span class="remove-item" onclick="removeFromCart(${index})">Remover</span>
            </div>
        `;
    }).join('');

    const totalFormatted = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('cart-total-value').innerText = `R$ ${totalFormatted}`;
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
        
        // Listagem direta de sabores
        item.flavors.forEach(f => {
            message += `  ▪️ ${f.qty}x un. — ${f.name}\n`;
        });
        
        // Subtotal do item formatado com milhar
        const itemTotalFormatado = itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        // Resumo do bloco compactado
        message += `  *Qtd Total:* ${item.quantity} un. | *Subtotal:* R$ ${itemTotalFormatado}\n`;
        message += "--------------------------------------\n";
    });

    // Valor Total formatado corretamente com separador de milhar
    const totalFormatado = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Bloco final de fechamento
    message += `\n💰 *VALOR TOTAL DO PEDIDO: R$ ${totalFormatado}*\n`;
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