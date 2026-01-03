import { LightningElement, api } from 'lwc';

export default class ScrollToTopButton extends LightningElement {
     handleClick() {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }
}