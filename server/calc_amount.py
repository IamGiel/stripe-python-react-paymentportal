import math

class CalclulateAmount:
  '''
    Class that will calculate the correct product before submitting the amount provided by the user to stripe.  
  '''
  def __init__(self, amount, currency):
    self.amount = amount
    self.currency = currency
    
  def get_amount(self):
    return self.amount
  
  def get_currency(self):
    return self.currency
  
  @staticmethod
  def basic_currency_codes(): 
    return  ["USD","AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BIF","BMD","BND","BOB","BRL","BSD","BWP","BYN","BZD","CAD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ETB","EUR","FJD","FKP","GBP","GEL","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","INR","ISK","JMD","JPY","KES","KGS","KHR","KMF","KRW","KYD","KZT","LAK","LBP","LKR","LRD","LSL","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRO","MUR","MVR","MWK","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SEK","SGD","SHP","SLE","SLL","SOS","SRD","STD","SZL","THB","TJS","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMW"]
  
  @staticmethod
  def three_decimal_codes():
    return [
      "BHD",
      "JOD",
      "KWD",
      "OMR",
      "TND",
    ]
  
  @staticmethod
  def zero_decimal_codes():
    return [
      "BIF",
      "CLP",
      "DJF",
      "GNF",
      "JPY",
      "KMF",
      "KRW",
      "MGA",
      "PYG",
      "RWF",
      "UGX",
      "VND",
      "VUV",
      "XAF",
      "XOF",
      "XPF"
    ]
  
  @staticmethod
  def convertThreeDecimalCurrencies(amount):
    amount = amount * 1000;
    res = (math.floor(amount/10) + 1) * 10;
    return res
  
  def calc(self):
    basics = self.basic_currency_codes()
    zero_dec = self.zero_decimal_codes()
    three_dec = self.three_decimal_codes()
    
    basics = [elt for elt in basics if elt not in zero_dec]
    zero_dec = [elt for elt in zero_dec if elt not in basics]
    three_dec = [elt for elt in three_dec if elt not in basics]
    
    print(f'new basic {basics}')
    if self.currency in basics:
      print('it is found in basic code')
      return self.amount * 100
    
    print(f'new zero dec {zero_dec}')
    
    if self.currency in three_dec:
      print(f'it is found in three decimal code')
      return self.convertThreeDecimalCurrencies(self.amount)
    
    print(f'new three dec {three_dec}')
    if self.currency in zero_dec:
      print(f'it is found in zero decimal code')
      return self.amount * 1
  
  
  
  
  
    
    
    
    
    
    
    