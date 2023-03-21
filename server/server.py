from fastapi import FastAPI, Request, Response, Depends, Body, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware

import calc_amount

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
YOUR_DOMAIN_LOCAL = 'http://localhost:9000/'
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
    "http://localhost:9000"
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
   
@app.post("/api/create-checkout-session", response_description="Creating payment session")
async def create_checkout_session(request: Request, form_data = Body(...)):
  data = form_data
  amount = calc_amount.CalclulateAmount(data['amount'], data['currency'])
  amount = amount.calc()
  print(f"amount is {amount} in currency: {data['currency']}")
  
  print(f'what is otherpurpose {data}')
  purpose = data['purpose']
  def getPurpose():
    if purpose == 'others':
      return data['otherPurpose']
    else:
      return purpose
  print(f'what is other {getPurpose()}')
    
  try:
    
    # *** UNCOMMENT TO CREATE customer id *** 
    # CUSTOMER_ID = stripe.Customer.create(
    #   email=data['email'],
    #   name=data['fullname'],
    #   description="My First Test Customer (created for API docs at https://www.stripe.com/docs/api)",
    # )
    
    #  create a price id
    PRICE_ID = stripe.Price.create(
      currency=data['currency'],
      # custom_unit_amount={"enabled": False},
      product=STRIPE_PRODUCT_ID,
      unit_amount=data['amount']
    )
    
    # get checkout URL
    checkout_session = stripe.checkout.Session.create(
      customer_email=data['email'],
      line_items=[{
          # "currency": data['currency'],
          # "quantity": 1,
          # "currency":data['currency'],
          # "amount": amount,  
          # "name":f'Payment Purpose: {getPurpose()}',
          # "images": ["https://d1wqzb5bdbcre6.cloudfront.net/f31d1727e1ac68b7d830488eb75640da59049ebeae9bb57e1c298700cc005f86/68747470733a2f2f66696c65732e7374726970652e636f6d2f6c696e6b732f4d44423859574e6a6446387851305a515a5656464d7a45324d45524659334e7966475a735833526c6333526654564532626e685a52575a72596b6b344f454648576d464a53465a4e59554d353030776d4c46694a4152"],
         "price_data": {
              "currency": data['currency'],
              "unit_amount": amount,  # input is in cents
              "product_data": {
                  "name": f"{getPurpose()}",
                  "images": ["https://d1wqzb5bdbcre6.cloudfront.net/f31d1727e1ac68b7d830488eb75640da59049ebeae9bb57e1c298700cc005f86/68747470733a2f2f66696c65732e7374726970652e636f6d2f6c696e6b732f4d44423859574e6a6446387851305a515a5656464d7a45324d45524659334e7966475a735833526c6333526654564532626e685a52575a72596b6b344f454648576d464a53465a4e59554d353030776d4c46694a4152"],
                  "description":"Beroe - leader in custom analysis and market research. A global leader in intelligence, data, and insights. Our Beroe LiVE.Ai™ platform enables more than 17,000 companies worldwide to make smarter sourcing decisions."
              },
          },
          "quantity": 1
        },
      ],
      mode="payment",
      # success_url=YOUR_DOMAIN_LOCAL + f'/success/{PRICE_ID.i  d}',
      success_url=f'{YOUR_DOMAIN_LOCAL}' + f'success/{PRICE_ID.id}',
      cancel_url=f'{YOUR_DOMAIN_LOCAL}' + f'canceled=true',
      invoice_creation={"enabled": True},
      metadata=data,
      custom_fields=[
        {
          "key": "message",
          "label": {"type": "custom", "custom": "Note:"},
          "type": "text",
        },
      ],
      
    )
    return checkout_session
    
  except Exception as e:
    # print(str(e))
    raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail=str(e))
    
@app.post("/payment-intent", response_description="Creating payment session")
async def create_payment_intent(form_data = Body(...)):
  print(type(form_data))
  print(form_data)
  data = json.dumps(form_data)
  dict_data = json.loads(data)
  amount = calc_amount.CalclulateAmount(dict_data['amount'], dict_data['currency'])
  amount = amount.calc()
  print(f"amount is {amount} in currency: {dict_data['currency']}")
  try:
    PAYMENT_INTENT = stripe.PaymentIntent.create(
      amount=amount,
      currency=dict_data['currency'],
      automatic_payment_methods={"enabled": False},
      receipt_email=dict_data['email'],
      statement_descriptor=dict_data['purpose'] if dict_data['purpose'] else dict_data['otherPurpose'],
      metadata=dict_data
      # confirm=True
    )
    return {
      "status":"SUCCESS",
      "msg":PAYMENT_INTENT
    }
  except Exception as e:
    print(e)
    raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail={
      "status":"FAIL",
      "msg":e
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
