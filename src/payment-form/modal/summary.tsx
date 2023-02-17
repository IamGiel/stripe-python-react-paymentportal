import CurrencyFormat from "react-currency-format";
import { json } from "stream/consumers";

const products = [
  {
    id: 1,
    name: 'Basic Tee',
    href: '#',
    price: '$36.00',
    color: 'Charcoal',
    size: 'L',
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/confirmation-page-06-product-01.jpg',
    imageAlt: "Model wearing men's charcoal basic tee in large.",
  },
  // More products...
]

export const Summary = (props:any) => {
  const {details, amountMasked} = props;
  const capitalize = (sometext:string) => {
    return sometext.charAt(0).toUpperCase() + sometext.slice(1)
  }

  const formatter = (currency:any) => new Intl.NumberFormat(undefined , {
    style: 'currency',
    currency: details.currency ? details.currency : "usd",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white">
        <body class="h-full">
        ```
      */}
      <main className="relative lg:min-h-full">
        

      <div className="mx-auto max-w-2xl py-1 px-4 sm:px-6 sm:py-1 lg:grid lg:max-w-7xl lg:grid-cols-1 lg:gap-x-8 lg:px-8 lg:py-4 xl:gap-x-24">
            <div className="lg:col-start-1">
              

             
              
              <dl className="space-y-1 border-t border-gray-200 pt-1 text-sm font-medium text-gray-500">
              {
                Object.keys(details).map((key)=>
                  <div className="flex justify-between">
                    <dt>{capitalize(key)}:</dt>
                    <dd className="text-gray-900">{details[key]}</dd>
                  </div>
                )
              }

                <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900">
                  <dt className="text-base">Total</dt>
                  {/* <dd className="text-base">{amountMasked}</dd> */}
                  <dd className="text-base">
                    <CurrencyFormat 
                        value={amountMasked} 
                        displayType={'text'}  
                        thousandSpacing={'3'}
                        decimalSeparator={''}
                        prefix={details.currency ? details.currency + " " : "usd"} 
                        fixedDecimalScale={true}
                        decimalScale={2}
                        renderText={value => {
                          
                          return (
                            <div className='flex font-black text-[19px] tracking-[3px]'><span>&nbsp;&nbsp;</span> {formatter(details.currency).format(details.amount).replace(/\s/g,' ')}</div>
                          )
                        }} 
                        className="font-['Inter'] text-sm"
                      />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
      </main>
    </>
  )
}
