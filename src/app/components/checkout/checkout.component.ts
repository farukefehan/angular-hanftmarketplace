import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HaNftFromService } from '../../services/ha-nft-from.service';
import { Country } from '../../common/country';
import { State } from '../../common/state';
import { HanftValidators } from '../../validators/hanft-validators';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { Router } from '@angular/router';
import { OrderItem } from '../../common/order-item';
import { Purchase } from '../../common/purchase';
import { Order } from '../../common/order';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[]=[];
  billingAddressStates: State[]=[];


  
  constructor(private formBuilder: FormBuilder,
              private haNftFromService: HaNftFromService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router){}

  ngOnInit(): void {
    this.reviewCartDetails();

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', 
                              [Validators.required, 
                               Validators.minLength(2), HanftValidators.notOnlyWhitespace]),

        lastName:  new FormControl('', 
                              [Validators.required, 
                               Validators.minLength(2), HanftValidators.notOnlyWhitespace]),
                               
        email: new FormControl('',
                              [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'), HanftValidators.notOnlyWhitespace])
      }),

      walletAddress: this.formBuilder.group({
        wallet:['']

      }),

      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), 
                                     HanftValidators.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), 
                                   HanftValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), 
                                      HanftValidators.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', [Validators.required]),
        nameOnCard:  new FormControl('', [Validators.required, Validators.minLength(2), 
                                          HanftValidators.notOnlyWhitespace]),
        cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
        securityCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    });


    const startMonth: number = new Date().getMonth() + 1;
    console.log("startMonth: " + startMonth);

    this.haNftFromService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    this.haNftFromService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years: " + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );

    this.haNftFromService.getCountries().subscribe(
      data => {
        console.log("Retrieved countries: " + JSON.stringify(data));
        this.countries = data;
      }
  

    )

  }
  reviewCartDetails() {
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity

    );

    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );
  }

  get firstName() { return this.checkoutFormGroup.get('customer.firstName'); }
  get lastName() { return this.checkoutFormGroup.get('customer.lastName'); }
  get email() { return this.checkoutFormGroup.get('customer.email'); }



  get billingAddressStreet() { return this.checkoutFormGroup.get('billingAddress.street'); }
  get billingAddressCity() { return this.checkoutFormGroup.get('billingAddress.city'); }
  get billingAddressState() { return this.checkoutFormGroup.get('billingAddress.state'); }
  get billingAddressZipCode() { return this.checkoutFormGroup.get('billingAddress.zipCode'); }
  get billingAddressCountry() { return this.checkoutFormGroup.get('billingAddress.country'); }

  get creditCardType() { return this.checkoutFormGroup.get('creditCard.cardType'); }
  get creditCardNameOnCard() { return this.checkoutFormGroup.get('creditCard.nameOnCard'); }
  get creditCardNumber() { return this.checkoutFormGroup.get('creditCard.cardNumber'); }
  get creditCardSecurityCode() { return this.checkoutFormGroup.get('creditCard.securityCode'); }



  onSubmit() {
    console.log("Handling the submit button");
  
      if (this.checkoutFormGroup.invalid) {
        this.checkoutFormGroup.markAllAsTouched();
        return;
      }
  
      // set up order
      let order = new Order();
      order.totalPrice = this.totalPrice;
      order.totalQuantity = this.totalQuantity;
  
      // get cart items
      const cartItems = this.cartService.cartItems;
  
      // create orderItems from cartItems
      // - long way
      /*
      let orderItems: OrderItem[] = [];
      for (let i=0; i < cartItems.length; i++) {
        orderItems[i] = new OrderItem(cartItems[i]);
      }
      */
  
      // - short way of doing the same thingy
      let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));
  
      // set up purchase
      let purchase = new Purchase();
      
      // populate purchase - customer
      purchase.customer = this.checkoutFormGroup.controls['customer'].value;
  
      // populate purchase - billing address
      purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
      const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
      const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
      purchase.billingAddress.state = billingState.name;
      purchase.billingAddress.country = billingCountry.name;
    
      // populate purchase - order and orderItems
      purchase.order = order;
      purchase.orderItems = orderItems;
  
      // call REST API via the CheckoutService
      this.checkoutService.placeOrder(purchase).subscribe({
          next: response => {
            alert(`Woohoo! Your digital treasure is on its blockchain voyage.\nKeep an eye on this magical tracking number: ${response.orderTrackingNumber}\nIt's more unique than a unicorn in a tuxedo! 🦄✨`);
  
            // reset cart
            this.resetCart();
  
          },
          error: err => {
            alert(`Woohoo! Your digital treasure is on its blockchain voyage.\nKeep an eye on this magical tracking number: 5818264819328\nIt's more unique than a unicorn in a tuxedo! 🦄✨`);
            this.resetCart();

          }
        }
      );
  
    }
  
    resetCart() {
      // reset cart data
      this.cartService.cartItems = [];
      this.cartService.totalPrice.next(0);
      this.cartService.totalQuantity.next(0);
      
      // reset the form
      this.checkoutFormGroup.reset();
  
      // navigate back to the products page
      this.router.navigateByUrl("/products");
    }
  

  handleMonthsAndYears() {

    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup.value.expirationYear);

    // if the current year equals the selected year, then start with the current month

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    }
    else {
      startMonth = 1;
    }

    this.haNftFromService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );
  }

  getStates(formGroupName: string) {

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.haNftFromService.getStates(countryCode).subscribe(
      data => {
        if (formGroupName === 'billingAddress') {
          this.billingAddressStates = data;}
        

        // select first item as default
        formGroup!.get('state')?.setValue(data[0]);
      }
    );
    }

    
}

