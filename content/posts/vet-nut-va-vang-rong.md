# Vết nứt và vàng ròng

Ở Nhật có một nghề gọi là **金継ぎ** — *kintsugi*. Khi một cái bát vỡ, người ta không giấu chỗ vỡ. Người ta lấy sơn mài trộn bột vàng, gắn các mảnh lại, và để đường nứt sáng lên thành một mạch vàng chạy ngang thân bát.

Cái bát sau khi vỡ đắt hơn cái bát chưa vỡ. Không phải vì vàng. Vì nó đã có tiểu sử.

## Chúng ta thì làm ngược lại

Trong nghề của tôi, mọi thứ được thiết kế để giấu vết nứt. `try / catch` để nuốt lỗi. Loading skeleton để che khoảng chờ. Bản build production đã minify đến mức không ai đọc được tên biến gốc. Người dùng chỉ thấy bề mặt phẳng lì, và chúng ta gọi đó là trải nghiệm tốt.

Tôi không phản đối. Phần lớn thời gian đó là việc đúng.

Nhưng tôi để ý rằng thói quen đó thấm ngược vào người. Ta bắt đầu minify cả bản thân mình. Bản CV không có khoảng trống. Bản tóm tắt dự án không có đoạn "chỗ này tôi làm sai ba tháng". Bài blog kỹ thuật nào cũng bắt đầu từ giải pháp, không ai kể phần lạc đường.

```js
// cái người ta đăng
const solution = optimize(problem);

// cái thật sự đã xảy ra
for (let i = 0; i < 40; i++) {
  const guess = tryAgain(problem);
  if (guess.works) break;      // dòng này chạy ở i = 37
}
```

## 侘寂

*Wabi-sabi* — cái đẹp của thứ không hoàn hảo, không vĩnh cửu, không đầy đủ. Ba cái "không" đó nghe như lời chê, nhưng thực ra là ba điều kiện của mọi thứ đang sống.

Một cái bàn gỗ có vân lệch. Một bức tường ngả màu theo mưa. Một dòng code viết vội lúc 2 giờ sáng, ba năm sau vẫn chạy, và không ai dám sửa vì không ai hiểu — kể cả người viết. Cái đó cũng có vẻ đẹp riêng, theo một nghĩa hơi buồn cười.

> Không có gì tồn tại mãi. Không có gì hoàn thành xong. Không có gì hoàn hảo.
> Ba câu đó nghe như tuyệt vọng, cho đến khi bạn thấy nhẹ hẳn người.

## Để đường nứt lộ ra

Tôi đang tập một thứ: khi viết gì đó, giữ lại đoạn mình còn phân vân. Không dọn cho sạch. Không đợi đến khi nghĩ thông rồi mới viết — vì thường thì viết mới là cách nghĩ thông.

Nên nếu bạn đọc thấy tôi mâu thuẫn với chính mình ở bài trước, thì tốt. Nghĩa là có gì đó đang di chuyển.

Vàng nằm ở chỗ nứt, không nằm ở chỗ lành.
