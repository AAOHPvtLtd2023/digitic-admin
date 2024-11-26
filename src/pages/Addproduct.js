import { React, useEffect, useState } from "react";
import CustomInput from "../components/CustomInput";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import Dropzone from "react-dropzone";
import { createProducts, resetState } from "../features/product/productSlice";
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { db } from "./firebaase.js";
import './css/Addproduct.css';


let schema = yup.object().shape({
  title: yup.string().required("Title is Required"),
  description: yup.string().required("Description is Required"),
  price: yup.number().required("Price is Required"),
  category: yup.string().required("Category is Required"),

});

const Addproduct = () => {
  const dispatch = useDispatch();
  const newProduct = useSelector((state) => state.product);
  const { isSuccess, isError, isLoading, createdProduct } = newProduct;
  const [productPhotos, setProductPhotos] = useState(new Array(5).fill(null));
  const [categories, setCategories] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await db.collection('categories').get();
        const categoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories: ', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (isSuccess && createdProduct) {
      toast.success("Product Added Successfullly!");
    }
    if (isError) {
      toast.error("Something Went Wrong!");
    }
  }, [isSuccess, isError, isLoading]);

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      productVideo: "",
      reviews: 0,
      rating: 0,
      specification: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {

      dispatch(createProducts(values));
      formik.resetForm();
      setTimeout(() => {
        dispatch(resetState());
      }, 3000);
    },
  });

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    if (index >= 0 && index < 5) {
      const photosArray = [...productPhotos];
      photosArray[index] = files[0];
      setProductPhotos(photosArray);
    }
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Ensure all required fields have values
    const { title, description, price, category, productVideo, reviews, rating, specification } = formik.values;
    if (!title || !description || !price || !category || productPhotos.every(photo => photo === null)) {
      console.error('Please fill in all required fields and upload at least one photo.');
      toast.error('Please fill in all required fields and upload at least one photo.');
      return;
    }

    try {
      const db = firebase.firestore();
      const storageRef = firebase.storage().ref();
      const categoryRef = db.collection('categories').doc(category);
      const productRef = categoryRef.collection('products');

      const productSnapshot = await categoryRef.collection('products').get();
      const productCount = productSnapshot.size + 1;
      const productId = `Product${productCount}`;

      const photoURLs = [];

      // Upload each photo
      for (let index = 0; index < productPhotos.length; index++) {
        const photo = productPhotos[index];
        if (photo) {
          const photoRef = storageRef.child(`product-photos/${category}/${productId}/photo${index + 1}`);
          const uploadTaskSnapshot = await photoRef.put(photo);
          const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL();
          photoURLs.push(downloadURL);
        }
      }

      // Add product to Firestore, ensuring no undefined fields
      await productRef.add({
        key: productId,
        title: title || '',
        description: description || '',
        price: parseFloat(price) || 0,
        category: category || '',
        photos: photoURLs,
        videoURL: productVideo || '',
        specifications: specification,
        rating: rating,
        reviews: reviews,
      });

      // Reset form after successful submission
      setProductPhotos(new Array(5).fill(null));
      setUploadProgress(0);
      toast.success("Product Added Successfully!");

      // Dispatch the Redux action to add product if needed
      dispatch(createProducts(formik.values));

      window.location.reload();

    } catch (error) {
      console.error('Error adding product: ', error);
      toast.error("Failed to add product!");
    }
  };



  return (
    <div>
      <h3 className="mb-4 title">Add Product</h3>
      <div>
        <form
          onSubmit={handleFormSubmit}
          className="d-flex gap-3 flex-column"
        >
          <span >Title : </span>
          <CustomInput
            type="text"
            name="title"
            onChng={formik.handleChange("title")}
            onBlr={formik.handleBlur("title")}
            val={formik.values.title}
            className="form-control mt-0"
          />
          <div className="error">
            {formik.touched.title && formik.errors.title}
          </div>
          <div className="">
            <span>Description : </span>
            <ReactQuill
              theme="snow"
              name="description"
              onChange={formik.handleChange("description")}
              value={formik.values.description}
            />
          </div>
          <div className="error">
            {formik.touched.description && formik.errors.description}
          </div>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1025 1023"><path fill="currentColor" d="m1006.914 680l-325 325q-18 18-44.5 18t-44.5-18l-574-574q-18-18-18-79V64q0-27 19-45.5t45-18.5h288q62 0 80 18l574 573q18 19 18 45t-18 44zm-750-553q-53 0-90.5 37.5t-37.5 90.5t37.5 90.5t90.5 37.5t90.5-37.5t37.5-90.5t-37.5-90.5t-90.5-37.5z" /></svg>
            Price :
          </span>
          <CustomInput
            type="number"
            label="Enter Product Price"
            name="price"
            onChng={formik.handleChange("price")}
            onBlr={formik.handleBlur("price")}
            val={formik.values.price}
          />
          <div className="error">
            {formik.touched.price && formik.errors.price}
          </div>

          <span>Category: </span>
          <select
            name="category"
            onChange={formik.handleChange("category")}
            onBlur={formik.handleBlur("category")}
            value={formik.values.category}
            className="form-control py-3 mb-3"
            id=""
          >
            <option value="" disabled>
              Select Category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="error">
            {formik.touched.tags && formik.errors.tags}
          </div>

          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1025 1024"><path fill="currentColor" d="M896.428 1024h-768q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h768q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-448.5-960q-26.5 0-45 18.5t-18.5 45t18.5 45.5t45.5 19t45.5-19t18.5-45.5t-19-45t-45.5-18.5zm192 0q-26.5 0-45 18.5t-18.5 45t18.5 45.5t45 19t45.5-19t19-45.5t-19-45t-45.5-18.5zm192.5 0q-27 0-45.5 18.5t-18.5 45t18.5 45.5t45.5 19t45.5-19t18.5-45.5t-18.5-45t-45.5-18.5zm64 256q0-27-19-45.5t-45-18.5h-640q-27 0-45.5 18.5t-18.5 45.5v512q0 27 18.5 45.5t45.5 18.5h640q26 0 45-18.5t19-45.5V320zm-385 437q-2 11-9 18l-45 45q-10 10-25 9q-15 1-25-9l-45-45q-5-5-8-11l-153-152q-9-9-9-22.5t9-22.5l46-46q9-9 22.5-9t22.5 9l137 135l302-327q10-9 23.5-9t22.5 9l46 46q9 9 9 22.5t-9 22.5z" /></svg>
            Specification : </span>
          <ReactQuill
            theme="snow"
            name="specification"
            onChange={formik.handleChange("specification")}
            value={formik.values.specification}
          />

          <span><b>*</b> Instructions-</span>
          <ul>
            <li>
              1st 3 should be display top of a product
            </li>
          </ul>
          <div className="error">
            {formik.touched.productSpecifications && formik.errors.productSpecifications}
          </div>

          {/* [photo] */}
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M18.5 3.75h-10A2.75 2.75 0 0 0 5.75 6.5v.25H5.5A2.75 2.75 0 0 0 2.75 9.5v8a2.75 2.75 0 0 0 2.75 2.75h10a2.75 2.75 0 0 0 2.75-2.75v-.25h.25a2.75 2.75 0 0 0 2.75-2.75v-8a2.75 2.75 0 0 0-2.75-2.75ZM7.25 6.5A1.25 1.25 0 0 1 8.5 5.25h10a1.25 1.25 0 0 1 1.25 1.25v6.2l-2.27-1.91a.74.74 0 0 0-1.05.08l-1.07 1.26l-4-3.88a.7.7 0 0 0-.52-.25a.75.75 0 0 0-.54.26l-3.05 3.63Zm1.25 9.25a1.25 1.25 0 0 1-1.25-1.25v-.3l3.67-4.32l3.46 3.39l-2.1 2.48Zm8.25 1.75a1.25 1.25 0 0 1-1.25 1.25h-10a1.25 1.25 0 0 1-1.25-1.25v-8A1.25 1.25 0 0 1 5.5 8.25h.25v6.25a2.75 2.75 0 0 0 2.75 2.75h8.25Zm1.75-1.75h-4.25l2.84-3.34l2.63 2.23a1.23 1.23 0 0 1-1.22 1.11Z" /></svg>
            Product Images : </span>
          <div className="bg-white border-1 p-4 " style={{ display: 'flex' }}>
            {productPhotos.map((photo, index) => (
              <label key={index} style={{ display: 'flex', fontStyle: 'italic', flexDirection: 'column', }}>
                Upload Photo {index + 1}:
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                {uploadProgress[index] > 0 && <p>Upload Progress: {uploadProgress[index]}%</p>}
              </label>
            ))}
          </div>

          {/* Video  */}
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.211 11.106L9.737 7.868A1.2 1.2 0 0 0 8 8.942v6.116a1.2 1.2 0 0 0 1.737 1.074l6.474-3.238a1 1 0 0 0 0-1.788" /><circle cx="12" cy="12" r="9" /></g></svg>
            Video link :
          </span>
          <textarea type="text" required className="form-control" value={formik.values.productVideo} onChange={formik.handleChange("productVideo")} />

          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 56 56"><path fill="currentColor" d="M28.012 28.023c5.578 0 10.125-4.968 10.125-11.015c0-6-4.5-10.711-10.125-10.711c-5.555 0-10.125 4.805-10.125 10.758c.023 6.023 4.57 10.968 10.125 10.968m0-3.539c-3.422 0-6.352-3.28-6.352-7.43c0-4.077 2.883-7.218 6.352-7.218c3.515 0 6.351 3.094 6.351 7.172c0 4.148-2.883 7.476-6.351 7.476m-14.719 25.22h29.438c3.89 0 5.742-1.173 5.742-3.75c0-6.142-7.735-15.024-20.461-15.024c-12.727 0-20.485 8.883-20.485 15.023c0 2.578 1.852 3.75 5.766 3.75m-1.125-3.54c-.61 0-.867-.164-.867-.656c0-3.844 5.953-11.04 16.71-11.04c10.759 0 16.688 7.196 16.688 11.04c0 .492-.234.656-.843.656Z" /></svg>
            Total Reviews:
          </span>
          <CustomInput
            type="number"
            name="reviews"
            onChng={formik.handleChange("reviews")}
            onBlr={formik.handleBlur("reviews")}
            val={formik.values.reviews}
            className="form-control mt-0"
          />
          <div className="error">
            {formik.touched.reviews && formik.errors.reviews}
          </div>

          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m12 .63l2.903 8.35l8.839.181l-7.045 5.341l2.56 8.462L12 17.914l-7.256 5.05l2.56-8.462L.259 9.161l8.839-.18L12 .63Zm0 6.092l-1.47 4.23l-4.478.091l3.569 2.706l-1.297 4.287L12 15.478l3.676 2.558l-1.296-4.287l3.568-2.706l-4.477-.09L12 6.721Z" /></svg>
            Ratings:
          </span>
          <CustomInput
            type="number"
            name="rating"
            onChng={formik.handleChange("rating")}
            onBlr={formik.handleBlur("rating")}
            val={formik.values.rating}
            className="form-control mt-0"
          />
          <div className="error">
            {formik.touched.rating && formik.errors.rating}
          </div>
          {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}

          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addproduct;
