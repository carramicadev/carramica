import { format } from "date-fns";
import numeral from 'numeral';


export default function formatDate(date) {

    return format(date || new Date(), 'dd/MM/yyyy kk:mm');
}
export const TimestampToDate = ({ timestamp }) => {
    // Convert the timestamp to milliseconds and format it
    const formattedDate = format(new Date(timestamp * 1000), "dd/MM/yyyy HH:mm");

    return formattedDate;
};
export function formatToDate(date) {

    return format(date || new Date(), 'dd/MM/yyyy ');
}

export function formatDateToYear(date) {
    return format(date || new Date(), 'yyyy')
}

numeral.register('locale', 'id', {
    delimiters: {
        thousands: '.',
        decimal: ','
    },
    abbreviations: {
        thousand: 'rb',
        million: 'jt',
        billion: 'm',
        trillion: 't'
    },
    currency: {
        symbol: 'Rp'
    }
})

numeral.locale('id');

export const currency = (number) => {
    // console.log(number)
    return numeral(number).format('$0,0');
}

export const decimal = (number) => {
    return numeral(number).format('$0,0.00');
}
