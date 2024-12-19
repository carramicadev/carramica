import { Navigate, Route, Routes } from "react-router-dom";
import DetailProduct from "./detailProduct";
import ListProduct from "./list";

export default function Product() {
    return <Routes>
        <Route index element={<ListProduct />} />
        <Route path="detailProduct/:productId" element={<DetailProduct />} />
    </Routes>

}