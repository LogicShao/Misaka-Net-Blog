---
title: '数学公式渲染测试'
description: '测试博客系统中的数学公式渲染功能，包括行内公式和块级公式'
pubDate: 'Nov 10 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
tags: ['测试', '数学']
---

本文档用于测试博客系统中的数学公式渲染功能。

## 行内公式

这是一个行内公式示例：勾股定理表示为 $a^2 + b^2 = c^2$，其中 $c$ 是斜边。

爱因斯坦质能方程 $E = mc^2$ 是物理学中最著名的公式之一。

## 块级公式

### 二次方程求根公式

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

### 欧拉公式

欧拉公式是数学中最美的公式之一：

$$
e^{i\pi} + 1 = 0
$$

### 微积分基本定理

$$
\int_a^b f(x)dx = F(b) - F(a)
$$

### 矩阵运算

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### 求和符号

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

### 极限

$$
\lim_{x \to \infty} \frac{1}{x} = 0
$$

### 偏导数

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}
$$

## 复杂公式

### 傅里叶变换

$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx
$$

### 麦克斯韦方程组

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 结论

如果你能看到上述所有公式都正确渲染，那么数学公式功能已经成功集成！🎉
