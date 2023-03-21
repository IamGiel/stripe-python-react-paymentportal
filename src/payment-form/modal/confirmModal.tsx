import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, NewspaperIcon } from '@heroicons/react/20/solid';
import React, { Fragment } from 'react'
import { Summary } from './summary';
import Style from './confirmModal.module.scss'
import { useNavigate } from 'react-router';

export const ConfirmModal = (props:any) => {
  const { isOpen, setIsOpen, formdata, amountMasked, stripeError } = props
  const navigate = useNavigate()
  
  const goStripeCheckout = (evt:any, details:any) => {
    console.log(details)
    evt.preventDefault()
    props.startStripeCheckout({"status":true, "details":details})
    return false
  }

  const onCloseModal = () => {
    console.log('closing modal')
    setIsOpen(false)
    navigate('/')
  }
  return (
   <Transition.Root show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-10" open={isOpen} onClose={onCloseModal}>
     <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
     </Transition.Child>

     <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
       <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        enterTo="opacity-100 translate-y-0 sm:scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
       >
        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
         <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
           {/* <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" /> */}
           <NewspaperIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-5">
           <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
            Payment Details
           </Dialog.Title>
           <div className="mt-2">
            <Summary details={formdata} amountMasked={amountMasked} />
            {stripeError && <span className="text-red-400">{stripeError}</span>}
           </div>
          </div>
         </div>
         <div className="mt-5 sm:mt-6">
          <button
           type="button"
           className="inline-flex w-full justify-center rounded-md border border-transparent bg-white-600 px-4 py-2 text-base font-medium text-black shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 sm:text-sm"
           onClick={onCloseModal}
          >
           Go back
          </button>
         </div>
         <div className="mt-5 sm:mt-6">
          <form action="/create-checkout-session" method="POST">
           <button className={Style.checkoutBtn} onClick={(evt) => goStripeCheckout(evt, formdata)} disabled={stripeError}>
            Stripe checkout
           </button>
          </form>
         </div>
        </Dialog.Panel>
       </Transition.Child>
      </div>
     </div>
    </Dialog>
   </Transition.Root>
  );


      
}
