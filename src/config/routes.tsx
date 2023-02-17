// import AboutPage from '../pages/about';
// import HomePage from '../pages/home';
import { IRoute } from '../interfaces/iRoute';
import { PaymentForm } from '../payment-form/paymentForm';
import { SuccessPage } from '../success/successpage';

const routes: IRoute[] = [
 {
  path: '*',
  name: 'Payment Form',
  component: PaymentForm,
  exact: true
 },
 {
  path: '/payment-form',
  name: 'Payment Form',
  component: PaymentForm,
  exact: true
 },
 {
  path: '/success/:id',
  name: 'Success Page',
  component: SuccessPage,
  exact: true
 }

 // {
 //     path: '/about/:number',
 //     name: 'About Page',
 //     component: AboutPage,
 //     exact: true
 // }
];

export default routes;
