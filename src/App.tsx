import React from 'react';
import logo from './logo.svg';
import './App.scss';
import styles from './app.module.scss';
import { PaymentForm } from './payment-form/paymentForm';
import { Footer } from './footer/footer';
import { Navbar } from './navbar/navbar';

import { BrowserRouter, Navigate, Route, RouterProps, Routes, useNavigate } from 'react-router-dom';
import routes from './config/routes';
import { SuccessPage } from './success/successpage';

const Layout = () => {
    return (
        <div className={styles.contentInside + ' content-inside'}>
            <PaymentForm />
        </div>
    );
};

function App() {
    return (
     <BrowserRouter>
      <div className="bg-gray-50 grid grid-row-3 gap-[22px]">
       <div className={styles.navbar + ' navbar'}>
        <Navbar />
       </div>
       <div className={styles.content + ' content'}>
        <div className={styles.contentInside + ' content-inside'}>
         {routes.map((item, id) => (
          <Routes key={id}>
           <Route path={item.path} element={<item.component />} />
          </Routes>
         ))}
        </div>
        {/* <Layout /> */}
       </div>
       <div className={styles.footer + ' footer'}>
        <Footer />
       </div>
      </div>
     </BrowserRouter>
    );
}

export default App;
