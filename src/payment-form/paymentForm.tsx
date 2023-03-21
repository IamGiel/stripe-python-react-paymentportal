import styles from './paymentForm.module.scss';
import React, { useEffect } from 'react'
import {useState} from 'react'
import {RadioGroup} from '@headlessui/react'
import {CheckCircleIcon, TrashIcon} from '@heroicons/react/20/solid'
import {Currencies, paymentpurposes} from './testdata'
import CurrencyFormat from 'react-currency-format';

import * as yup from 'yup';
import {
  Formik,
  FormikHelpers,
  FormikProps,
  Form,
  Field,
  FieldProps,
} from 'formik';
import { Value } from 'sass';
import { ConfirmModal } from './modal/confirmModal';
import { request, RequestOptions } from 'http';
import { stripe_minimum_validator } from './stripe_minimum_validator';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface IPaymentForm {
  fullname: string,
  title: string,
  company: string,
  email: string,
  purpose: string,
  purpose1: string,
  amount: number,
  currency:string
}


export const PaymentForm = () => {

  const intialState: IPaymentForm | null = {
    fullname: "",
    title: "",
    company: "",
    email: "",
    purpose: "",
    purpose1: "",
    amount: 0,
    currency:""
  }

  const [formValues, setFormValues] = useState<IPaymentForm>(intialState)
  const [formErrors, setFormErrors] = useState<any>({});
  const [showConfirm, setShowConfirm] = useState(false)
  const [amountMasked, setAmountMasked] = useState('')
  const [stripeError, setStripeError] = useState(null)
  const [redirectUrl, setRedirectUrl] = useState('')
  const navigate = useNavigate()
  

  let PaymentSchema = yup.object({
    fullname: yup.string().required().label('Fullname').test({
      name: 'test-fullname-value',
      skipAbsent: true,
      test(value, ctx) {
        const isVAlidFullname = value.trim().indexOf(' ') != -1;
        if (!isVAlidFullname) {
          return ctx.createError({ message: 'Please type your full name' })
        }
        return true
      }
    }),
    title: yup.string().required().label("Title"),
    company: yup.string().required().label("Company"),
    email: yup.string().email().required().label('Email').test({
      name: 'test-email-value',
      skipAbsent: true,
      test(value, ctx) {
        const isValidEmail = value.match(emailReg);
        if (!isValidEmail) {
          return ctx.createError({ message: 'Please enter a valid email' })
        }
        return true
      }
    }),
    purpose: yup.string().required().label("Purpose"),
    purpose1: yup.string().when('purpose', {
      is: 'others', // alternatively: (val) => val == true
      then: (rule) =>  rule.required().label("This"),
    }),
    currency: yup.string().required().label("Currency"),
    amount: yup.number().positive().required().test({
      name: 'test-amount-value',
      skipAbsent: true,
      test(value, ctx) {
        const isInteger = Number.isInteger(value)
        // const convertedValue = 
        // if (!isInteger) {
        //   return ctx.createError({ message: 'Please enter a whole number.' })
        // }
        if (value > 999999) {
          return ctx.createError({ message: 'Max amount is 1,000,000' })
        }
        if (value < 5) {
          return ctx.createError({ message: 'Min amount is 5' })
        }
        // if(stripeError){
        //   return ctx.createError({ message: stripeError })
        // }
        
        return true
      }
    })
  })

  const handleChangeCurrency = (values:any) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const requestOptions:any = {
      method: 'POST',
      headers:myHeaders,
      body: JSON.stringify(values),
      redirect: 'follow'
    };

    console.log(requestOptions)
    
    try {
      const response = fetch("http://localhost:8000/payment-intent", requestOptions)
      response.then(data=>data.json()).then(res=>{
        console.log(res.detail)
        
        if(res.detail?.status == 'FAIL') {
          setShowConfirm(false)
          setStripeError(res.detail?.msg)
          return;
        }
        setShowConfirm(true)
        setStripeError(res.detail?.msg)


      })
    } catch (error) {
      console.log(error)
      return error
    }
  }

  const formatter = (currency:any) => new Intl.NumberFormat(undefined , {
    style: 'currency',
    currency: currency ? currency : "usd",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });
  

  const onSubmitForm = (evt : any) => {
    evt.preventDefault()
    console.log(formValues)
    
  }

  useEffect(()=>{
    console.log(JSON.stringify(formValues))
   
    
  },[formValues])

  const emailReg = new RegExp(
    /^(?![&'`])(([^<>()[\]\\.,^*%;!*$#`~:\s@"]+(\.[^<>()*[\]\\.,`*~%^#;$:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
  );
  
  const startStripe = (info:any) => {
    console.log(info)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const requestOptions:any = {
      method: 'POST',
      headers:myHeaders,
      body: JSON.stringify(info.details),
      redirect: 'follow'
    };
    
    try {
      fetch('http://localhost:8000/api/create-checkout-session', requestOptions)
       .then((response) => response.text())
       .then((result) => {
        // alert(result)
        // if(result.details)
        let url = JSON.parse(result).url;
        console.log(url);
        setRedirectUrl(url);
        // window.location.assign(redirectUrl);
        // let win = window.open(redirectUrl, '_blank');
        // win?.focus();
       })
       .catch((error) => {
        console.log('error', error);
        alert(error);
        setStripeError(error);
        return false;
       });
    } catch (error) {
      console.log(error)
    }
    
      // return false
    
  }

  useEffect(() => {
   if(redirectUrl){
     let win = window.open(redirectUrl, '_blank');
     win?.focus();
   }
  })
  
  const sleep = (ms:any) => new Promise((resolve) => setTimeout(resolve, ms));
  
  const validateAmount = (values: any, touched:any, errors:any) => {
    console.log(errors.amount)
    if(touched.amount && values.amount && errors.amount){
      console.log("amount and currency is touched ", values.amount, touched.amount)
      
    }
  //  return sleep(2000).then(() => {
  //   const errors: any = {};
  //   if (['admin', 'null', 'god'].includes(values)) {
  //    errors['amount'] = 'Nice try';
  //   }
  //   // ...
  //   return errors;
  //  });
  };
  

  
  

  return (
   <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
    {showConfirm && <ConfirmModal isOpen={showConfirm} setIsOpen={setShowConfirm} formdata={formValues} amountMasked={amountMasked} startStripeCheckout={startStripe} stripeError={stripeError} />}
    <Formik
     initialValues={intialState}
     validationSchema={PaymentSchema}
     onSubmit={(values, actions) => {
      setFormValues(values);
      // console.log({ values, actions });
      // alert(JSON.stringify(values, null, 2));
      actions.setSubmitting(false);
      // setShowConfirm(true)
      handleChangeCurrency(values);
     }}
    >
     {({ errors, touched, values, isValid, isSubmitting }) => (
      <Form className="payment-main-section lg:grid lg:grid-cols-4 lg:gap-x-12 xl:gap-x-16">
       {/* <span>{JSON.stringify(values,null,2)}</span> */}
       <div className="col-span-2 col-start-2">
        <div className="payment-main-inner-wrapper">
         <h2 className={styles.pageTitle + ` pageTitle`}>Beroe Online Payment</h2>
         
         <p className={styles.subTitle + ` subtitle`}>One-time payment portal for Beroe paid offerings</p>
         {/* <p>{JSON.stringify(stripeError)}</p> */}
         <div className="mt-4 grid grid-cols-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
          <div className="col-span-3">
           <div className="mt-1">
            <Field type="text" id="fullname" name="fullname" autoComplete="given-name" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} />
           </div>
           <label htmlFor="fullname" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Fullname <span>&nbsp;&nbsp;</span>
            {touched.fullname && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.fullname}</span>
             </div>
            )}
           </label>
          </div>

          <div className="col-span-3">
           <div className="mt-1">
            <Field type="text" name="title" id="title" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} />
           </div>
           <label htmlFor="title" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Title <span>&nbsp;&nbsp;</span>
            {touched.title && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.title}</span>
             </div>
            )}
           </label>
          </div>

          <div className="col-span-3">
           <div className="mt-1">
            <Field type="text" name="company" id="company" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} />
           </div>
           <label htmlFor="company" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Company <span>&nbsp;&nbsp;</span>{' '}
            {touched.company && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.company}</span>
             </div>
            )}
           </label>
          </div>
          {/* payment purpose */}
          <div className="col-span-3">
           <div className="mt-1">
            <Field as="select" id="purpose" name="purpose" autoComplete="purpose" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'}>
             {paymentpurposes.map((item, index) => {
              return (
               <option className="py-2 text-[12px]" key={index} value={item.id}>
                {item.value}
               </option>
              );
             })}{' '}
            </Field>
           </div>
           <label htmlFor="purpose" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Payment purpose <span>&nbsp;&nbsp;</span>
            {touched.purpose && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.purpose}</span>
             </div>
            )}
           </label>
          </div>

          {touched.purpose && values.purpose == 'others' && (
           <div className="col-span-3">
            <div className="mt-1">
             <Field type="text" id="purpose1" name="purpose1" autoComplete="purpose1" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} />
            </div>
            <label htmlFor="purpose1" className="flex text-sm font-medium text-gray-700 mt-[12px]">
             Other reason <span>&nbsp;&nbsp;</span>
             {touched.purpose1 && touched.purpose && values.purpose == 'others' && (
              <div className={styles.validationContainer + ' validation-container'}>
               <span>{errors.purpose1}</span>
              </div>
             )}
            </label>
           </div>
          )}

          <div className="col-span-3">
           <div className="mt-1">
            <Field as="select" id="currency" name="currency" autoComplete="currency" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'}>
             {Object.keys(Currencies).map((item: any, index) => {
              return (
               <option className="py-2 text-[12px]" key={index} value={Currencies[item].code}>
                {Currencies[item].name}
               </option>
              );
             })}{' '}
            </Field>
           </div>
           <label htmlFor="currency" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Currency <span>&nbsp;&nbsp;</span>
            {touched.currency && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.currency}</span>
             </div>
            )}
           </label>
          </div>

          <div className="col-span-3">
           <div className="mt-1">
            <Field type="number" max="999,999" name="amount" id="amount" autoComplete="amount" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} validate={validateAmount(values, touched, errors)}/>
           </div>
           <label htmlFor="amount" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Amount
            {touched.amount && !errors.amount && !stripeError && (
             <CurrencyFormat
              value={values.amount}
              displayType={'text'}
              thousandSpacing={'3'}
              decimalSeparator={''}
              prefix={values.currency ? values.currency + ' ' : 'usd'}
              fixedDecimalScale={true}
              decimalScale={2}
              renderText={(value) => {
               setAmountMasked(value);
               return (
                <div className="flex font-black text-[19px] tracking-[3px]">
                 <span>&nbsp;&nbsp;</span> {formatter(values.currency).format(values.amount).replace(/\s/g, ' ')}
                </div>
               );
              }}
              className="font-['Inter'] text-sm"
             />
            )}
            <span>&nbsp;&nbsp;</span>{' '}
            {touched.amount && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.amount ? errors.amount : stripeError}</span>
             </div>
            )}
           </label>
          </div>

          <div className="col-span-3">
           <div className="mt-1">
            <Field type="email" name="email" id="email" autoComplete="email" style={{ backgroundColor: '#F9FAFB' }} className={styles.fieldStyles + ' block w-full'} />
           </div>
           <label htmlFor="email" className="flex text-sm font-medium text-gray-700 mt-[12px]">
            Email <span>&nbsp;&nbsp;</span>{' '}
            {touched.email && (
             <div className={styles.validationContainer + ' validation-container'}>
              <span>{errors.email}</span>
             </div>
            )}
           </label>
          </div>

          <div className="col-start-2 col-span-1">
           <button
            type="submit"
            data-modal-target="popup-modal"
            data-modal-toggle="popup-modal"
            className={
              (isValid ? styles.contBtn : styles.disableBtn) +
              ' border py-3 px-4 text-base font-medium text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50'
              }
            // onClick={()=>setShowConfirm(true)}
           >
            Continue
           </button>
          </div>
         </div>
        </div>
       </div>
      </Form>
     )}
    </Formik>
   </div>
  );
    }
