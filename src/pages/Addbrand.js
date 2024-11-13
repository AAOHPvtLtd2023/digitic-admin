import { React, useEffect,useState } from "react";
// import CustomInput from "../components/CustomInput";
// import { useDispatch} from "react-redux";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { db } from "./firebaase.js";
import firebase from 'firebase/compat/app';

let schema = yup.object().shape({
  product: yup.string().required("Brand Name is Required"),
});
const Addbrand = () => {
  // const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [products, setproducts] = useState([]);
  const [category, setcategory] = useState('');

  const handleCategoryChange = (e) => {
    setcategory(e.target.value);
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await db.collection('categories').get();
        const categoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(categoryData);
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories: ', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await db.collection('categories').doc(category).collection("products").get();
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setproducts(productData);
      } catch (error) {
        console.error('Error fetching Products: ', error);
      }
    };
    fetchProducts();
  }, [category]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      product: "",
    },
    validationSchema: schema,
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      toast.error("Please Upload A category &product")
      return;
    }
    if (formik.values.product==='') {
      toast.error("Please Upload A category &product")
      return;
    }

    try {
      const db = firebase.firestore();
      const sliderRef = db.collection('bestproduct');

      const sliderSnapshot = await db.collection('bestproduct').get();
      const sliderCount = sliderSnapshot.size + 1;
      const sliderId = `Product${sliderCount}`;


      // Add product to Firestore
      await sliderRef.doc(sliderId).set({
        category: category,
        product: formik.values.product,
      });

      // Clear the input fields after successful submission
      toast.success("Product Added Succesfully")
      window.location.reload();
    } catch (error) {
      toast.error('Something was Wromg')
      console.error('Error adding product: ', error);
    }
  };

  return (
    <div>
      <h3 className="mb-4 title">
        Add Product
      </h3>
      <div>
        <form action="" onSubmit={handleFormSubmit}>
          <select
            name="category"
            onChange={handleCategoryChange}
            onBlur={formik.handleBlur("category")}
            value={category}
            className="form-control py-3  mt-3"
            id=""
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="product"
            onChange={formik.handleChange("product")}
            onBlur={formik.handleBlur("product")}
            value={formik.values.product}
            className="form-control py-3  mt-3"
            id=""
          >
            <option value="">Select a Product</option>
            {products.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>

          <div className="error">
            {formik.touched.product && formik.errors.product}
          </div>

          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addbrand;
