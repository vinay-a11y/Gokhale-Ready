document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-container");
  
    try {
      const response = await fetch("/api/products");
      const products = await response.json();
  
      if (Array.isArray(products)) {
        products.forEach(product => {
          const div = document.createElement("div");
          div.classList.add("product-card");
          div.innerHTML = `
            <h3>${product.item_name}</h3>
            <p><strong>Category:</strong> ${product.category || "N/A"}</p>
            <p><strong>Price 01:</strong> ₹${product.price_01 || "N/A"} (${product.packing_01 || ""})</p>
            <p><strong>Description:</strong> ${product.description || "No description"}</p>
          `;
          container.appendChild(div);
        });
      } else {
        container.textContent = "No products found.";
      }
    } catch (error) {
      container.textContent = "Failed to load products.";
      console.error(error);
    }
  });
  