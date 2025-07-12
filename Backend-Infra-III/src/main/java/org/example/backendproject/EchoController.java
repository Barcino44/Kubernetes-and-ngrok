package org.example.backendproject;


import org.example.backendproject.Entity.*;
import org.example.backendproject.ResponseRequest.*;
import org.example.backendproject.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(maxAge = 3600)
@RestController
public class EchoController {
    @Autowired
    ClientRepository repositoryClient;
    @Autowired
    ProductRepository repositoryProduct;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private ShoppingCartRepository shoppingCartRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private PurchaseRepository purchaseRepository;
    @PostMapping("/client/login")
    public ResponseEntity<?> loginAdmin(@RequestBody LoginRequestClient loginRequest) {
        var client = repositoryClient.searchByLogin(loginRequest.getEmail(), loginRequest.getPassword());
        if (client.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new LoginResponse("Incorrecto nombre o contraseña"));
        } else {
            return ResponseEntity.status(200).body(client.get());
        }
    }
    @PostMapping("/client/register")
    public ResponseEntity<?> loginRegister(@RequestBody Client client) {
        var c = repositoryClient.searchByEmail(client.getEmail());
        if(c.isPresent()){
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new RegisterResponse("Ya existe un usuario con ese correo"));
        } else{
            repositoryClient.save(client);
            ShoppingCart shoppingCartId = createCart(client.getId());
            if(shoppingCartId != null){
                client.setShoppingCar(shoppingCartId);
            }
            repositoryClient.save(client);
            return ResponseEntity.status(200).body(new RegisterResponse("Se ha añadido un cliente"));
        }
    }
    @GetMapping("/client/getProducts")
    public ResponseEntity<?> listDoctorPage() {
        var products = repositoryProduct.findAll();
        return ResponseEntity.status(200).body(products);
    }
    public ShoppingCart createCart(Long id) {
        Optional<Client> client = clientRepository.findClientById(id);
        ShoppingCart shoppingCart = new ShoppingCart();
        if(client.isPresent()){
            shoppingCart.setClient(client.get());
            shoppingCartRepository.save(shoppingCart);
        }
        return shoppingCart;
    }
    @PostMapping("/shoppingCart/addItem/client/{clientId}/product/{productId}/quantity/{quantity}")
    public ResponseEntity<?> addCartItem(@PathVariable Long clientId, @PathVariable Long productId, @PathVariable Integer quantity) {
        Optional<Client> client = clientRepository.findClientById(clientId);
        Optional<Product> product = repositoryProduct.findById(productId);
        if (client.isPresent() && product.isPresent()) {
            CartItem cartItem = new CartItem();
            cartItem.setQuantity(quantity);
            cartItem.setProduct(
                    product.get()
            );
            ShoppingCart shoppingCart = client.get().getShoppingCar();
            cartItem.setShoppingCart(shoppingCart);
            cartItemRepository.save(cartItem);
            shoppingCart.addCartItem(cartItem);
            shoppingCartRepository.save(shoppingCart);
            return ResponseEntity.status(HttpStatus.CREATED).body(cartItem);
        }
        return ResponseEntity.status(500).body("No existe el producto");
    }
    @GetMapping("/shoppingCart/getItems/clientId/{clientId}")
    public ResponseEntity<?> getCartItem(@PathVariable Long clientId) {
        Optional<Client> client = clientRepository.findClientById(clientId);
        List<CartItem> products = new ArrayList<>();
        if(client.isPresent()){
            ShoppingCart shoppingCart = client.get().getShoppingCar();
            for(CartItem cartItem : shoppingCart.getCartItems()) {
                products.add(cartItem);
            }
            return ResponseEntity.status(HttpStatus.OK).body(products);
        }
        return ResponseEntity.status(500).body("Algo salio mal");

    }
    @DeleteMapping("/shoppingCart/deleteItem/item/{itemId}/client/{clientId}")
    public ResponseEntity<?> deleteCartItem(@PathVariable Long itemId, @PathVariable Long clientId) {
        Optional<Client> client = clientRepository.findClientById(clientId);
        if(client.isPresent()){
            ShoppingCart shoppingCart = client.get().getShoppingCar();
            Optional<CartItem> cartItem = cartItemRepository.findById(itemId);
            cartItem.ifPresent(item -> shoppingCart.getCartItems().remove(item));
            cartItemRepository.delete(cartItem.get());
            shoppingCartRepository.save(shoppingCart);
            return ResponseEntity.status(HttpStatus.OK).body(shoppingCart);
        }
        return ResponseEntity.status(500).body("Algo salio mal");
    }
    @PostMapping("/shoppingCart/checkout/client/{clientId}")
    public ResponseEntity<?> checkoutCart(
            @PathVariable Long clientId,
            @RequestBody Purchase purchase) {
        Optional<Client> clientOpt = clientRepository.findClientById(clientId);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Cliente no encontrado");
        }
        ShoppingCart shoppingCart = clientOpt.get().getShoppingCar();
        for (CartItem item : new ArrayList<>(shoppingCart.getCartItems())) {
            shoppingCart.getCartItems().remove(item);
            cartItemRepository.delete(item);
        }
        shoppingCartRepository.save(shoppingCart);
        purchase.setClient(clientOpt.get());
        purchaseRepository.save(purchase);
        return ResponseEntity.status(200).body(new RegisterResponse("Compra realizada correctamente"));
    }
}
