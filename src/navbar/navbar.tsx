import React from 'react'
import styles from './navbar.module.scss'

export const Navbar = () => {
  return (
    <div className='flex flex-row justify-center'>
      {/* <div className={styles.navbar + ` navbar-section`}>BEROE LOGO</div> */}
      <div className={styles.beroelogo}></div>
    </div>
  )
}
