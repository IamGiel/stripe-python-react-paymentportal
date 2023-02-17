from fastapi import FastAPI, Request, Response, Depends, Body, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

import stripe

import os
from dotenv import load_dotenv
load_dotenv()

import requests
import json

from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi.responses import HTMLResponse

from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
STRIPE_KEY = os.environ.get("STRIPE_TEST_KEY")
STRIPE_PRICE_ID = os.environ.get("STRIP_PRICE_ID")
STRIPE_PRODUCT_ID = os.environ.get('STRIP_PRODUCT_ID')
YOUR_DOMAIN_LOCAL = 'http://localhost:3000'
YOUR_DOMAIN_PROD = 'http://pay.beroeinc.com'
CURRENCY_CONVERTER_API = os.environ.get('CURRENCY_CONVERTER_API')
WEBHOOK_SECRET=os.environ.get("WEBHOOK_SECRET")

class CsrfSettings(BaseModel):
  secret_key:str = 'test'

@CsrfProtect.load_config
def get_csrf_config():
  return CsrfSettings()

# This is your test secret API key.
stripe.api_key = f"{STRIPE_KEY}"

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/items/{id}", response_class=HTMLResponse)
async def read_item(request: Request, id: str):
    return templates.TemplateResponse("item.html", {"request": request, "id": id})

@app.post('/convert-currency', response_description='checks user input amount and validates to minimum required')
async def check_minimum(amount = Body(...)):
  print(CURRENCY_CONVERTER_API)
  r = requests.get(f"https://api.exchangerate-api.com/v4/latest/USD")
  j=r.json()
  print(j)
  return j
   
@app.post("/create-checkout-session", response_description="Creating payment session")
async def create_checkout_session(request: Request, form_data = Body(...)):
  purpose = form_data['purpose']
  purpose1 = form_data['purpose1']
  def getPurpose():
    if purpose == 'others':
      return purpose1
    else:
      return purpose
  print(f'what is other {getPurpose()}')
    
  try:
    
    # *** UNCOMMENT TO CREATE customer id *** 
    # CUSTOMER_ID = stripe.Customer.create(
    #   email=form_data['email'],
    #   name=form_data['fullname'],
    #   description="My First Test Customer (created for API docs at https://www.stripe.com/docs/api)",
    # )
    
    #  create a price id
    PRICE_ID = stripe.Price.create(
      currency=form_data['currency'],
      custom_unit_amount={"enabled": True},
      product=STRIPE_PRODUCT_ID
    )
    
    # get checkout URL
    checkout_session = stripe.checkout.Session.create(
      customer_email=form_data['email'],
      line_items=[{
            "currency": form_data['currency'],
         
          "quantity": 1,
          "currency":form_data['currency'],
          "amount": form_data['amount'] * 100,
          "name":form_data['fullname'],          
        },
      ],
      mode="payment",
      success_url=YOUR_DOMAIN_LOCAL + f'/success/{PRICE_ID.id}',
      cancel_url=YOUR_DOMAIN_LOCAL + '?canceled=true',
      invoice_creation={"enabled": True},
      metadata=form_data
      
    )
    
    # *** UNCOMMENT this config for editable amount in the checkout page ***
    # checkout_session = stripe.checkout.Session.create(
    #   line_items=[
    #     {
    #       "quantity": 1,
    #       "currency":form_data['currency'],
    #       "adjustable_quantity":{
    #         "enabled":True,
    #       },
    #       "amount": form_data['amount'],
    #       "name": getPurpose(),
    #       # "price": 'price_1MZo1fE3160DEcsrQRwTvucP',
    #     },
    #   ],
    #   mode="payment",
    #   success_url=YOUR_DOMAIN_LOCAL + '?success=true',
    #   cancel_url=YOUR_DOMAIN_LOCAL + '?canceled=true',
    #   consent_collection={
    #     'terms_of_service': 'required',
    #   },
    #   customer_email=customer['email']
      
    # )
    
    

    return checkout_session
    
  except Exception as e:
    # print(str(e))
    raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail=str(e))
    
  # return RedirectResponse(checkout_session.url, status_code=303)

@app.post("/payment-intent", response_description="Creating payment session")
async def create_payment_intent(request: Request, form_data = Body(...)):
  try:
    PAYMENT_INTENT = stripe.PaymentIntent.create(
      amount=form_data['amount']*100,
      currency=form_data['currency'],
      automatic_payment_methods={"enabled": False},
      receipt_email=form_data['email'],
      statement_descriptor=f"{form_data['purpose']}  {form_data['purpose1']}",
      metadata=form_data
      # confirm=True
    )
    return {
      "status":"SUCCESS",
      "msg":PAYMENT_INTENT
    }
  except Exception as e:
    print(e.error)
    raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail={
      "status":"FAIL",
      "msg":e.error.message
    })
    
@app.get('/create-invoice', response_description="create an invoice link")
async def create_invoice(request: Request, form_data = Body(...)):
  try: 
    # create a customer id
    CUSTOMER_ID = stripe.Customer.create(
      email=form_data['email'],
      name=form_data['fullname'],
      description="My First Test Customer (created for API docs at https://www.stripe.com/docs/api)",
    )
    INVOICE = stripe.Invoice.create(  
      customer=CUSTOMER_ID,
    )
    return INVOICE
  except Exception as e:
  # Something else happened, completely unrelated to Stripe
    return e
  
@app.get('/create-payment-link', response_description="create an invoice link")
async def create_invoice(request: Request, form_data = Body(...)):
  try: 
    #  create a price id
    PRICE_ID = stripe.Price.create(
      currency=form_data['currency'],
      custom_unit_amount={"enabled": True},
      product=STRIPE_PRODUCT_ID
    )
    
    PAYMENT_LINK = stripe.PaymentLink.create(
      line_items=[{"price": PRICE_ID, "quantity": 1}],
      invoice_creation={
        "enabled": True,
        "invoice_data": {
          "description": "Invoice for Product X",
          "metadata": {"order": "order-xyz"},
          # "account_tax_ids": ["txr_1Mb3vOE3160DEcsrBpjsuSEN"],
          "custom_fields": [{"name": "Purchase Order", "value": "PO-XYZ"}],
          "rendering_options": {"amount_tax_display": "include_inclusive_tax"},
          "footer": "B2B Inc.",
        },
      },
    )
    return PAYMENT_LINK
  except Exception as e:
    return e

@app.post('/webhook', response_description="listens to stripe events", response_class=JSONResponse)
async def my_webhook_view(request:Request, payload = Body(...), csrf_protect:CsrfProtect = Depends()):
  '''
  webhook endpoint
  '''
  # json_payload = payload
  # event = stripe.Event.construct_from(json_payload, stripe.api_key)
  sig_header = request.headers.get('stripe-signature')
  
  print(request.headers.items())
  
  # return event

  try:
    event = stripe.Webhook.construct_event(
      payload, os.environ.get('WEBHOOK_SECRET'), sig_header
    )
  except ValueError as e:
    # Invalid payload
    return jsonable_encoder({'error':str(e)})
  except stripe.error.SignatureVerificationError as e:
    # Invalid signature
    return jsonable_encoder({'error':str(e)})

  # Passed signature verification
  print(event.type)
  print(type(event.data.object))
  print(event.data.object.id)
  return jsonable_encoder({'status':'success'})

  # Do stuff


@app.get("/")
async def root():
    return 'Hello world - Its Python! 🐍 '
