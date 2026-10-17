// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'label_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LabelModel {

 String get id; String get name; String get colorHex; bool get isSystem; int get unreadCount; int get totalCount;
/// Create a copy of LabelModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LabelModelCopyWith<LabelModel> get copyWith => _$LabelModelCopyWithImpl<LabelModel>(this as LabelModel, _$identity);

  /// Serializes this LabelModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LabelModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.colorHex, colorHex) || other.colorHex == colorHex)&&(identical(other.isSystem, isSystem) || other.isSystem == isSystem)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.totalCount, totalCount) || other.totalCount == totalCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,colorHex,isSystem,unreadCount,totalCount);

@override
String toString() {
  return 'LabelModel(id: $id, name: $name, colorHex: $colorHex, isSystem: $isSystem, unreadCount: $unreadCount, totalCount: $totalCount)';
}


}

/// @nodoc
abstract mixin class $LabelModelCopyWith<$Res>  {
  factory $LabelModelCopyWith(LabelModel value, $Res Function(LabelModel) _then) = _$LabelModelCopyWithImpl;
@useResult
$Res call({
 String id, String name, String colorHex, bool isSystem, int unreadCount, int totalCount
});




}
/// @nodoc
class _$LabelModelCopyWithImpl<$Res>
    implements $LabelModelCopyWith<$Res> {
  _$LabelModelCopyWithImpl(this._self, this._then);

  final LabelModel _self;
  final $Res Function(LabelModel) _then;

/// Create a copy of LabelModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? colorHex = null,Object? isSystem = null,Object? unreadCount = null,Object? totalCount = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,colorHex: null == colorHex ? _self.colorHex : colorHex // ignore: cast_nullable_to_non_nullable
as String,isSystem: null == isSystem ? _self.isSystem : isSystem // ignore: cast_nullable_to_non_nullable
as bool,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,totalCount: null == totalCount ? _self.totalCount : totalCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [LabelModel].
extension LabelModelPatterns on LabelModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LabelModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LabelModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LabelModel value)  $default,){
final _that = this;
switch (_that) {
case _LabelModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LabelModel value)?  $default,){
final _that = this;
switch (_that) {
case _LabelModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String colorHex,  bool isSystem,  int unreadCount,  int totalCount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LabelModel() when $default != null:
return $default(_that.id,_that.name,_that.colorHex,_that.isSystem,_that.unreadCount,_that.totalCount);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String colorHex,  bool isSystem,  int unreadCount,  int totalCount)  $default,) {final _that = this;
switch (_that) {
case _LabelModel():
return $default(_that.id,_that.name,_that.colorHex,_that.isSystem,_that.unreadCount,_that.totalCount);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String colorHex,  bool isSystem,  int unreadCount,  int totalCount)?  $default,) {final _that = this;
switch (_that) {
case _LabelModel() when $default != null:
return $default(_that.id,_that.name,_that.colorHex,_that.isSystem,_that.unreadCount,_that.totalCount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LabelModel implements LabelModel {
  const _LabelModel({required this.id, required this.name, required this.colorHex, required this.isSystem, this.unreadCount = 0, this.totalCount = 0});
  factory _LabelModel.fromJson(Map<String, dynamic> json) => _$LabelModelFromJson(json);

@override final  String id;
@override final  String name;
@override final  String colorHex;
@override final  bool isSystem;
@override@JsonKey() final  int unreadCount;
@override@JsonKey() final  int totalCount;

/// Create a copy of LabelModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LabelModelCopyWith<_LabelModel> get copyWith => __$LabelModelCopyWithImpl<_LabelModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LabelModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LabelModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.colorHex, colorHex) || other.colorHex == colorHex)&&(identical(other.isSystem, isSystem) || other.isSystem == isSystem)&&(identical(other.unreadCount, unreadCount) || other.unreadCount == unreadCount)&&(identical(other.totalCount, totalCount) || other.totalCount == totalCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,colorHex,isSystem,unreadCount,totalCount);

@override
String toString() {
  return 'LabelModel(id: $id, name: $name, colorHex: $colorHex, isSystem: $isSystem, unreadCount: $unreadCount, totalCount: $totalCount)';
}


}

/// @nodoc
abstract mixin class _$LabelModelCopyWith<$Res> implements $LabelModelCopyWith<$Res> {
  factory _$LabelModelCopyWith(_LabelModel value, $Res Function(_LabelModel) _then) = __$LabelModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String colorHex, bool isSystem, int unreadCount, int totalCount
});




}
/// @nodoc
class __$LabelModelCopyWithImpl<$Res>
    implements _$LabelModelCopyWith<$Res> {
  __$LabelModelCopyWithImpl(this._self, this._then);

  final _LabelModel _self;
  final $Res Function(_LabelModel) _then;

/// Create a copy of LabelModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? colorHex = null,Object? isSystem = null,Object? unreadCount = null,Object? totalCount = null,}) {
  return _then(_LabelModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,colorHex: null == colorHex ? _self.colorHex : colorHex // ignore: cast_nullable_to_non_nullable
as String,isSystem: null == isSystem ? _self.isSystem : isSystem // ignore: cast_nullable_to_non_nullable
as bool,unreadCount: null == unreadCount ? _self.unreadCount : unreadCount // ignore: cast_nullable_to_non_nullable
as int,totalCount: null == totalCount ? _self.totalCount : totalCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
