import React from 'react'
import styles from './footer.module.scss'

export const Footer = () => {
  return (
    <div className={styles.footer + ` footer-section`}>
     <div className='grid grid-col-1 place-items-center gap-[12px]'>
      <div className='row-span-1'>If you have any questions, contact us at ask@beroe-inc.com.</div>
      <div className='row-span-1'>© Beroe Inc. 2023.</div>
     </div>
    </div>
  )
}
