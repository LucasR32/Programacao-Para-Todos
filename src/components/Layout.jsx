import Footer from './Footer.jsx';
import Header from './Header.jsx';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
