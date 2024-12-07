// !!! DO NOT ADD #pragma once !!! //

RGB_MATRIX_EFFECT(keyfunc)

#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS

extern bool rgb_matrix_user_keyfunc(void);

static bool keyfunc(effect_params_t* params) {
    return rgb_matrix_user_keyfunc();
}

#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
