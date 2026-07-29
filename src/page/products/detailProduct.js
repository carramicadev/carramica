import "bootstrap/dist/css/bootstrap.min.css";
import "react-phone-input-2/lib/style.css";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  arrayRemove,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore, storage } from "../../FirebaseFrovider";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";
import { Button } from "react-bootstrap";
import {
  ArrowLeft,
  Border,
  PlusLg,
  XCircle,
  XCircleFill,
} from "react-bootstrap-icons";
import { useSnackbar } from "notistack";
import Header from "../../components/Header";

export default function DetailProduct() {
  const { productId } = useParams();
  const fileInputRef = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  const [form, setForm] = useState({
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    nama: "",
    sku: "",
    harga: 0,
    stok: 0,
    thumbnail: [],
    description: "",
    cogs: 0,
    warning_stock: 0,
    status: "Live",
    category: {},
  });
  const [error, setError] = useState({
    weight: "",
    height: "",
    width: "",
    length: "",
    nama: "",
    sku: "",
    harga: "",
    stok: "",
    thumbnail: "",
    description: "",
  });
  const [dataKategori, setDataKategori] = useState([]);
  useEffect(() => {
    // if () {
    // const fetchData = async () => {
    const getDoc = query(collection(firestore, "categories"));
    // const documentSnapshots = await getDocs(getDoc);
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDataKategori(updatedData); // Update the state with the new data
    });
    return () => unsubscribe();
    // };
    // fetchData();
    // }
  }, []);
  console.log(dataKategori);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);
    if (e.target.type === "number") {
      setForm({ ...form, [name]: parseInt(value) });
    } else if (name === "category") {
      const findcateg = dataKategori.find((cat) => cat.id === value);
      setForm({ ...form, [name]: findcateg });
    } else {
      setForm({ ...form, [name]: value });
    }

    setError({
      ...error,
      [name]: "",
    });
  };
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const docRef = doc(firestore, "product", productId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setForm({
            ...form,
            ...doc.data(),
          });
        } else {
          // setError("Document does not exist");
        }
        setLoading(false);
      },
      (error) => {
        // setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [productId]);

  // thumbnail
  const handleUploadProduct = async (e) => {
    const file = e.target.files[0];
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxFileSize = 512000; // 500 KB

    if (!allowedTypes.includes(file.type)) {
      setError((prev) => ({
        ...prev,
        thumbnail: `Tipe file tidak didukung: ${file.type}`,
      }));
      return;
    }

    if (file.size >= maxFileSize) {
      setError((prev) => ({
        ...prev,
        thumbnail: `Ukuran file terlalu besar > 500KB`,
      }));
      return;
    }

    const reader = new FileReader();

    reader.onabort = () => {
      setError((prev) => ({
        ...prev,
        thumbnail: `Proses pembacaan file dibatalkan`,
      }));
    };

    reader.onerror = () => {
      setError((prev) => ({
        ...prev,
        thumbnail: "File tidak bisa dibaca",
      }));
    };

    reader.onload = async () => {
      setError((prev) => ({
        ...prev,
        thumbnail: "",
      }));
      setLoading(true);

      try {
        // Prepare Storage Reference
        const thumbnailExt = file.name.substring(file.name.lastIndexOf("."));
        const thumbnailPath = `products/${productId}/thumbnail_${Date.now()}${thumbnailExt}`;
        const thumbnailRef = ref(storage, thumbnailPath);

        // Upload File
        await uploadString(thumbnailRef, reader.result, "data_url");

        // Get Download URL
        const thumbnailUrl = await getDownloadURL(thumbnailRef);

        // Update Firestore
        const prodDocRef = doc(firestore, "product", productId);
        const updatedThumbnail = [...(form?.thumbnail ?? []), thumbnailUrl];

        await setDoc(
          prodDocRef,
          {
            ...form,
            thumbnail: updatedThumbnail,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update Local State
        setForm((currentForm) => ({
          ...currentForm,
          thumbnail: updatedThumbnail,
        }));
      } catch (error) {
        setError((prev) => ({
          ...prev,
          thumbnail: error.message,
        }));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteThumb = (thumb) => async (e) => {
    e.preventDefault(); // Prevent the default behavior (e.g., form submission or page refresh)
    console.log(thumb);
    if (window.confirm("Anda yakin ingin menghapus thumbnail ini?")) {
      if (thumb) {
        try {
          setLoading(true);
          const storageRef = ref(storage, thumb);
          await deleteObject(storageRef);
          console.log("Thumbnail deleted from storage!");

          // Update Firestore document to remove the thumbnail
          const prodDocRef = doc(firestore, "product", productId); // Adjust collection and doc ID as needed
          await updateDoc(prodDocRef, {
            thumbnail: arrayRemove(thumb),
          });
          setForm((prodForm) => ({
            ...prodForm,
            thumbnail: prodForm.thumbnail.filter((m) => m !== thumb),
          }));
          setLoading(false);
        } catch (e) {
          setLoading(false);
          console.log(e.message);
        }
      }
    }
  };
  // validate
  const validate = () => {
    const newError = { ...error };
    // console.log('er')

    if (!form.width) {
      // console.log('er')
      newError.width = "width is required";
    }

    if (!form.height) {
      newError.height = "height is required";
    }
    if (!form.weight) {
      newError.weight = "weight is required";
    }
    if (!form.length) {
      newError.length = "length is required";
    }
    if (!form.nama) {
      newError.nama = "nama is required";
    }
    if (!form.sku) {
      newError.sku = "sku is required";
    }
    if (!form.harga) {
      newError.harga = "harga is required";
    }
    if (!form.stok) {
      newError.stok = "stok is required";
    }

    return newError;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const findErros = validate();
    if (Object.values(findErros).some((err) => err !== "")) {
      console.log("Errors found:", findErros);
      setError(findErros);
    } else {
      try {
        await setDoc(
          doc(firestore, "product", productId),
          {
            ...form,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        // console.log("Document written with ID: ",);
        enqueueSnackbar(`sukses mengedit product ${form?.nama}`, {
          variant: "success",
        });

        navigate(`/products`);
      } catch (e) {
        enqueueSnackbar(`gagal menambahkan product ${e.message}`, {
          variant: "error",
        });
      }
    }
  };

  console.log(form);
  return (
    <div className="container" style={{ paddingTop: "80px", paddingBottom: "40px" }}>
      <Header />

      {/* Back Button */}
      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
        <button
          onClick={() => navigate("/products")}
          style={{
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            color: "#666",
            fontSize: "14px",
            padding: "8px 0",
          }}
        >
          <ArrowLeft size={20} />
          <span>Kembali ke Products</span>
        </button>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>Edit Product</h2>
        <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>
          Update informasi produk dan detail lainnya
        </p>
      </div>

      <form>
        {/* Product Information Card */}
        <div
          className="card shadow-sm"
          style={{
            padding: "24px",
            marginBottom: "20px",
            borderRadius: "12px",
            border: "none"
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ fontWeight: "bold", color: "#333" }}>Informasi Produk</h5>
          </div>

          {/* SKU Field */}
          <div className="mb-4">
            <label className="form-label fw-medium" for="sku" style={{ marginBottom: "8px" }}>
              SKU
            </label>
            <input
              disabled
              className="form-control"
              id="sku"
              readonly=""
              type="text"
              value={form?.sku}
              style={{ backgroundColor: "#f5f5f5" }}
            />
            <p style={{ fontSize: "12px", color: "#888", marginTop: "6px", marginBottom: 0 }}>
              SKU tidak bisa diedit setelah terjadi pembelian
            </p>
          </div>

          {/* SKU Rapin Field */}
          <div className="mb-4">
            <label className="form-label fw-medium" for="sku_rapin" style={{ marginBottom: "8px" }}>
              SKU Rapin
            </label>
            <input
              onChange={handleFormChange}
              name="sku_rapin"
              className="form-control"
              id="sku_rapin"
              type="text"
              value={form?.sku_rapin || form?.sku || ""}
              placeholder="Masukkan SKU Rapin"
            />
          </div>

          {/* Name Field */}
          <div className="mb-4">
            <label className="form-label fw-medium" for="name" style={{ marginBottom: "8px" }}>
              Nama Produk <span style={{ color: "red" }}>*</span>
            </label>
            <input
              onChange={handleFormChange}
              name="nama"
              className={`form-control ${error.nama ? "is-invalid" : ""}`}
              id="name"
              type="text"
              value={form?.nama}
              placeholder="Masukkan nama produk"
            />
            {error.nama && <div className="invalid-feedback">{error.nama}</div>}
          </div>

          {/* Category Field */}
          <div className="mb-4">
            <label className="form-label fw-medium" for="category" style={{ marginBottom: "8px" }}>
              Kategori
            </label>
            <select
              className="form-select"
              id="category"
              name="category"
              onChange={handleFormChange}
              value={form?.category?.id || ""}
            >
              <option value="">Pilih Kategori</option>
              {dataKategori?.map((kur) => (
                <option key={kur?.id} value={kur?.id}>
                  {kur?.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Photo & Description Card */}
        <div
          className="card shadow-sm"
          style={{
            padding: "24px",
            marginBottom: "20px",
            borderRadius: "12px",
            border: "none"
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ fontWeight: "bold", color: "#333" }}>Foto & Deskripsi</h5>
          </div>

          {/* Product Photo */}
          <div className="mb-4">
            <label className="form-label fw-medium" style={{ marginBottom: "12px" }}>
              Foto Produk
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {form.thumbnail?.map((thumb) => (
                <div
                  key={thumb}
                  style={{
                    position: "relative",
                    width: "100px",
                    height: "100px"
                  }}
                >
                  <img
                    src={thumb}
                    width="100px"
                    height="100px"
                    alt=""
                    style={{ borderRadius: "8px", objectFit: "cover" }}
                  />
                  <button
                    onClick={handleDeleteThumb(thumb)}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  >
                    <XCircleFill color="red" size={16} />
                  </button>
                </div>
              ))}
              {form?.thumbnail?.length < 10 && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleUploadProduct}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                  />
                  <button
                    style={{
                      backgroundColor: "transparent",
                      border: "2px dashed #ccc",
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    disabled={loading}
                    onClick={handleButtonClick}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "#3D5E54";
                      e.target.style.backgroundColor = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "#ccc";
                      e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    <PlusLg color="#666" size={24} />
                  </button>
                </div>
              )}
            </div>
            {error.thumbnail && (
              <p style={{ fontSize: "12px", color: "red", marginTop: "8px" }}>{error.thumbnail}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label fw-medium" for="description" style={{ marginBottom: "8px" }}>
              Deskripsi Produk
            </label>
            <textarea
              onChange={handleFormChange}
              name="description"
              className="form-control"
              id="description"
              rows="4"
              value={form?.description}
              placeholder="Masukkan deskripsi produk"
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Pricing Card */}
        <div
          className="card shadow-sm"
          style={{
            padding: "24px",
            marginBottom: "20px",
            borderRadius: "12px",
            border: "none"
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ fontWeight: "bold", color: "#333" }}>Harga</h5>
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <label className="form-label fw-medium" for="harga-satuan" style={{ marginBottom: "8px" }}>
                Harga Jual <span style={{ color: "red" }}>*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">Rp</span>
                <input
                  onChange={handleFormChange}
                  name="harga"
                  className={`form-control ${error.harga ? "is-invalid" : ""}`}
                  id="harga-satuan"
                  type="number"
                  value={form?.harga}
                />
                {error.harga && <div className="invalid-feedback">{error.harga}</div>}
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <label className="form-label fw-medium" for="cogs" style={{ marginBottom: "8px" }}>
                COGS (Harga Modal)
              </label>
              <div className="input-group">
                <span className="input-group-text">Rp</span>
                <input
                  className="form-control"
                  id="cogs"
                  name="cogs"
                  type="number"
                  value={form?.cogs}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Management Card */}
        <div
          className="card shadow-sm"
          style={{
            padding: "24px",
            marginBottom: "20px",
            borderRadius: "12px",
            border: "none"
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ fontWeight: "bold", color: "#333" }}>Manajemen Produk</h5>
          </div>

          <div className="row">
            <div className="col-md-4 mb-4">
              <label className="form-label fw-medium" for="product-status" style={{ marginBottom: "8px" }}>
                Status Produk
              </label>
              <select
                className="form-select"
                id="product-status"
                name="status"
                value={form?.status}
                onChange={handleFormChange}
              >
                <option value="Live">Live</option>
                <option value="Hold">Hold</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Discontinued">Discontinued</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="col-md-4 mb-4">
              <label className="form-label fw-medium" for="product-stock" style={{ marginBottom: "8px" }}>
                Stok <span style={{ color: "red" }}>*</span>
              </label>
              <input
                onChange={handleFormChange}
                name="stok"
                className={`form-control ${error.stok ? "is-invalid" : ""}`}
                id="product-stock"
                type="number"
                value={form?.stok}
              />
              {error.stok && <div className="invalid-feedback">{error.stok}</div>}
            </div>

            <div className="col-md-4 mb-4">
              <label className="form-label fw-medium" for="warning-stock" style={{ marginBottom: "8px" }}>
                Stok Minimum (Warning)
              </label>
              <input
                className="form-control"
                id="warning-stock"
                name="warning_stock"
                type="number"
                value={form?.warning_stock}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>

        {/* Weight & Shipping Card */}
        <div
          className="card shadow-sm"
          style={{
            padding: "24px",
            marginBottom: "20px",
            borderRadius: "12px",
            border: "none"
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ fontWeight: "bold", color: "#333" }}>Berat & Pengiriman</h5>
          </div>

          <div className="row">
            <div className="col-md-4 mb-4">
              <label className="form-label fw-medium" for="product-weight" style={{ marginBottom: "8px" }}>
                Berat (gram) <span style={{ color: "red" }}>*</span>
              </label>
              <div className="input-group">
                <input
                  onChange={handleFormChange}
                  name="weight"
                  className={`form-control ${error.weight ? "is-invalid" : ""}`}
                  id="product-weight"
                  type="number"
                  value={form?.weight}
                />
                <span className="input-group-text">gr</span>
                {error.weight && <div className="invalid-feedback">{error.weight}</div>}
              </div>
            </div>

            <div className="col-md-8 mb-4">
              <label className="form-label fw-medium" style={{ marginBottom: "8px" }}>
                Ukuran (P x L x T)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <input
                    onChange={handleFormChange}
                    name="length"
                    className={`form-control ${error.length ? "is-invalid" : ""}`}
                    placeholder="Panjang"
                    type="number"
                    value={form?.length}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    onChange={handleFormChange}
                    name="width"
                    className={`form-control ${error.width ? "is-invalid" : ""}`}
                    placeholder="Lebar"
                    type="number"
                    value={form?.width}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    onChange={handleFormChange}
                    name="height"
                    className={`form-control ${error.height ? "is-invalid" : ""}`}
                    placeholder="Tinggi"
                    type="number"
                    value={form?.height}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {error.length && <small className="text-danger">{error.length}</small>}
                {error.width && <small className="text-danger">{error.width}</small>}
                {error.height && <small className="text-danger">{error.height}</small>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="d-flex justify-content-end gap-3"
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            position: "sticky",
            bottom: "20px"
          }}
        >
          <button
            onClick={() => navigate("/products")}
            className="btn btn-outline-secondary"
            type="button"
            style={{
              padding: "10px 24px",
              borderRadius: "8px"
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            type="submit"
            style={{
              backgroundColor: "#3D5E54",
              border: "none",
              padding: "10px 32px",
              borderRadius: "8px"
            }}
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
